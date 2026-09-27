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
    .select("*, categories(name, slug), product_variants(id,name,price,stock,quantity_value,sort_order)")
    .eq("status", "active").order("popularity", { ascending: false });
  if (error) throw new Error("Katalog belum dapat dimuat.");
  return data;
});

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((value) => z.object({ slug: z.string().trim().min(1).max(100) }).parse(value))
  .handler(async ({ data }) => {
    const { data: product, error } = await publicClient().from("products")
      .select("*, categories(name, slug), product_variants(id,name,price,stock,quantity_value,sort_order)")
      .eq("slug", data.slug).eq("status", "active").maybeSingle();
    if (error) throw new Error("Produk belum dapat dimuat.");
    return product;
  });

const orderSchema = z.object({
  robloxUsername: z.string().trim().min(3).max(20).regex(/^[A-Za-z0-9_]+$/),
  robloxDisplayName: z.string().trim().min(1).max(50),
  whatsapp: z.string().trim().regex(/^\+?[0-9]{9,15}$/),
  discordUsername: z.string().trim().max(50).optional().default(""),
  notes: z.string().trim().max(500).optional().default(""),
  paymentMethod: z.enum(["QRIS", "DANA", "GoPay", "Bank Transfer"]),
  idempotencyKey: z.string().uuid(),
  items: z.array(z.object({ product_id: z.string().uuid(), variant_id: z.string().uuid().nullable(), quantity: z.number().int().min(1).max(99) })).min(1).max(30),
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
    });
    if (error) throw new Error(error.message);
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