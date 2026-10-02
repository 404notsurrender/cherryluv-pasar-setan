import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient() {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']!;
  return createClient<Database>(process.env['SUPABASE_URL']!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
}

export const getCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient().from("products")
    .select("*, categories(name, slug, parent_id), product_variants(id,name,price,stock,quantity_value,sort_order,active)")
    .eq("status", "active").order("sort_order").order("popularity", { ascending: false });
  if (error) throw new Error("Katalog belum dapat dimuat.");
  return data.map((p) => ({ ...p, product_variants: (p.product_variants ?? []).filter((v) => v.active) }));
});

export const getStorefront = createServerFn({ method: "GET" }).handler(async () => {
  const c = publicClient();
  const [cats, products] = await Promise.all([
    c.from("categories").select("id,name,slug,description,icon,sort_order,parent_id").eq("active", true).order("sort_order"),
    c.from("products").select("*, categories(name, slug, parent_id), product_variants(id,name,price,stock,quantity_value,sort_order,active)").eq("status", "active").order("sort_order").order("popularity", { ascending: false }),
  ]);
  if (cats.error || products.error) throw new Error("Katalog belum dapat dimuat.");
  return { categories: cats.data, products: products.data.map((p) => ({ ...p, product_variants: (p.product_variants ?? []).filter((v) => v.active) })) };
});

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((value) => z.object({ slug: z.string().trim().min(1).max(100) }).parse(value))
  .handler(async ({ data }) => {
    const { data: product, error } = await publicClient().from("products")
      .select("*, categories(name, slug, parent_id), product_variants(id,name,price,stock,quantity_value,sort_order,active)")
      .eq("slug", data.slug).eq("status", "active").maybeSingle();
    if (error) throw new Error("Produk belum dapat dimuat.");
    if (!product) return null;
    let pricing_rule = null;
    if (product.pricing_type === "koin" || product.pricing_type === "robux_gift") {
      const { data: rule } = await publicClient().from("pricing_rules").select("key,name,rate,unit,minimum_amount,increment").eq("key", product.pricing_type).maybeSingle();
      pricing_rule = rule;
    }
    let parent = null;
    if (product.categories?.parent_id) {
      const { data: pc } = await publicClient().from("categories").select("name,slug").eq("id", product.categories.parent_id).maybeSingle();
      parent = pc;
    }
    return { ...product, parent_category: parent, pricing_rule, product_variants: (product.product_variants ?? []).filter((v) => v.active) } as unknown as import("@/lib/store-data").Product & { parent_category: { name: string; slug: string } | null };
  });

function friendlyOrderError(m: string) {
  if (m.includes("Invalid amount")) return "Jumlah tidak sesuai minimum atau kelipatan yang berlaku.";
  if (m.includes("stock")) return "Stok tidak mencukupi.";
  if (m.includes("Login data")) return "Data login Roblox wajib diisi.";
  if (m.includes("unavailable")) return "Produk sedang tidak tersedia.";
  return "Pesanan gagal dibuat. Periksa kembali datamu.";
}

const orderSchema = z.object({
  robloxUsername: z.string().trim().min(3).max(20).regex(/^[A-Za-z0-9_]+$/),
  robloxDisplayName: z.string().trim().min(1).max(50),
  whatsapp: z.string().trim().regex(/^\+?[0-9]{9,15}$/),
  discordUsername: z.string().trim().max(50).optional().default(""),
  notes: z.string().trim().max(500).optional().default(""),
  paymentMethod: z.literal("QRIS"),
  idempotencyKey: z.string().uuid(),
  items: z.array(z.object({ product_id: z.string().uuid(), variant_id: z.string().uuid().nullable(), quantity: z.number().int().min(1).max(99), amount: z.number().int().positive().max(1_000_000_000).optional() })).min(1).max(30),
  credentials: z.object({ username: z.string().trim().min(3).max(50), password: z.string().min(1).max(200), backupCode: z.string().trim().max(200).optional().default("") }).optional(),
});

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value) => orderSchema.parse(value))
  .handler(async ({ data, context }) => {
    const { data: orderNumber, error } = await context.supabase.rpc("create_order", {
      p_roblox_username: data.robloxUsername,
      p_roblox_display_name: data.robloxDisplayName,
      p_whatsapp: data.whatsapp,
      p_discord_username: data.discordUsername,
      p_notes: data.notes,
      p_payment_method: data.paymentMethod,
      p_items: data.items,
      p_idempotency_key: data.idempotencyKey,
      ...(data.credentials ? { p_credentials: { username: data.credentials.username, password: data.credentials.password, backup_code: data.credentials.backupCode } } : {}),
    });
    if (error) throw new Error(friendlyOrderError(error.message));
    return { orderNumber };
  });

export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("orders")
      .select("*, customers(roblox_username), order_items(*)")
      .eq("user_id", context.userId).order("created_at", { ascending: false });
    if (error) throw new Error("Riwayat pesanan belum dapat dimuat.");
    return data;
  });

export const trackOrder = createServerFn({ method: "POST" })
  .inputValidator((value) => z.object({ orderNumber: z.string().trim().min(8).max(30), identity: z.string().trim().min(3).max(30) }).parse(value))
  .handler(async ({ data }) => {
    const { data: found, error } = await publicClient().rpc("track_order", { p_order_number: data.orderNumber, p_identity: data.identity });
    if (error) throw new Error("Pesanan belum dapat diperiksa.");
    return found[0] ?? null;
  });

export const getAdminData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Akses admin diperlukan.");
    const [{ data: orders, error: orderError }, { data: products, error: productError }] = await Promise.all([
      context.supabase.from("orders").select("*, customers(roblox_username,roblox_display_name,whatsapp), order_items(product_name,variant_name,quantity,subtotal)").order("created_at", { ascending: false }),
      context.supabase.from("products").select("*, categories(name,slug)").order("created_at", { ascending: false }),
    ]);
    if (orderError || productError) throw new Error("Data admin belum dapat dimuat.");
    return { orders: orders ?? [], products: products ?? [] };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value) => z.object({ id: z.string().uuid(), status: z.enum(["pending_payment","payment_confirmed","processing","completed","cancelled","paid","expired"]), paymentStatus: z.enum(["pending","paid","failed","refunded","expired"]) }).parse(value))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Akses admin diperlukan.");
    const { error } = await context.supabase.from("orders").update({ status: data.status, payment_status: data.paymentStatus, updated_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value) => z.object({ id: z.string().uuid(), name: z.string().trim().min(2).max(100), basePrice: z.number().int().min(0), stock: z.number().int().min(0), status: z.enum(["active","draft","archived"]) }).parse(value))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Akses admin diperlukan.");
    const { error } = await context.supabase.from("products").update({ name: data.name, base_price: data.basePrice, stock: data.stock, status: data.status, updated_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value) => z.object({ name: z.string().trim().min(2).max(100), slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(100), categoryId: z.string().uuid(), description: z.string().trim().min(10).max(1000), basePrice: z.number().int().min(0), stock: z.number().int().min(0), imageKey: z.enum(["coins","shards","food"]) }).parse(value))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Akses admin diperlukan.");
    const { error } = await context.supabase.from("products").insert({ category_id: data.categoryId, name: data.name, slug: data.slug, description: data.description, image_key: data.imageKey, base_price: data.basePrice, stock: data.stock });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const archiveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value) => z.object({ id: z.string().uuid() }).parse(value))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Akses admin diperlukan.");
    const { error } = await context.supabase.from("products").update({ status: "archived", updated_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Akses admin diperlukan.");
}

export const getAdminExtras = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const s = context.supabase;
    const [rules, creds, notifs, cats, variants] = await Promise.all([
      s.from("pricing_rules").select("*").order("key"),
      s.from("order_credentials").select("order_id, roblox_username, roblox_password, backup_code, status, updated_at, orders(order_number, status, payment_status)").order("created_at", { ascending: false }),
      s.from("notifications").select("id, channel, status, error, created_at, orders(order_number)").order("created_at", { ascending: false }).limit(100),
      s.from("categories").select("id, name, slug, parent_id, sort_order, active").order("sort_order"),
      s.from("product_variants").select("id, product_id, name, price, stock, active, sort_order").order("sort_order"),
    ]);
    return {
      rules: (rules.data ?? []) as { key: string; name: string; rate: number; unit: number; minimum_amount: number; increment: number }[],
      credentials: (creds.data ?? []) as unknown as { order_id: string; roblox_username: string; roblox_password: string | null; backup_code: string | null; status: string; updated_at: string; orders: { order_number: string; status: string; payment_status: string } | null }[],
      notifications: (notifs.data ?? []) as unknown as { id: string; channel: string; status: string; error: string | null; created_at: string; orders: { order_number: string } | null }[],
      categories: cats.data ?? [],
      variants: variants.data ?? [],
    };
  });

export const updatePricingRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ key: z.string().min(1).max(30), rate: z.number().int().min(1), unit: z.number().int().min(1), minimumAmount: z.number().int().min(1), increment: z.number().int().min(1) }).parse(v))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("pricing_rules").update({ rate: data.rate, unit: data.unit, minimum_amount: data.minimumAmount, increment: data.increment, updated_at: new Date().toISOString() }).eq("key", data.key);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateVariant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid(), price: z.number().int().min(0), stock: z.number().int().min(0), active: z.boolean() }).parse(v))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("product_variants").update({ price: data.price, stock: data.stock, active: data.active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid(), name: z.string().trim().min(2).max(60), active: z.boolean() }).parse(v))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("categories").update({ name: data.name, active: data.active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const clearCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ orderId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("order_credentials").update({ roblox_password: null, backup_code: null, status: "cleared", updated_at: new Date().toISOString() }).eq("order_id", data.orderId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
