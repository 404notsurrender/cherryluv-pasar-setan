import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Package, ShoppingCart, Wallet } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clearCredentials, getAdminData, getAdminExtras, updateCategory, updateOrderStatus, updatePricingRule, updateProduct, updateVariant } from "@/lib/commerce.functions";
import { rupiah, statusLabel } from "@/lib/store-data";

export const Route = createFileRoute("/_authenticated/admin")({
  loader: async () => { const [main, extras] = await Promise.all([getAdminData(), getAdminExtras()]); return { ...main, ...extras }; },
  head: () => ({ meta: [{ title: "Admin — MDZ Store" }, { name: "description", content: "Panel pengelolaan toko." }, { property: "og:title", content: "Admin MDZ Store" }, { property: "og:description", content: "Pengelolaan toko." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  errorComponent: () => <main className="mx-auto max-w-lg px-4 py-28 text-center"><h1 className="text-3xl font-black">Akses admin diperlukan</h1><p className="mt-2 text-muted-foreground">Akun pelanggan tidak dapat membuka halaman ini.</p></main>,
  component: AdminPage,
});

const msg = (e: unknown) => (e instanceof Error ? e.message : "Gagal");

function AdminPage() {
  const d = Route.useLoaderData();
  const [orders, setOrders] = useState(d.orders);
  const statusFn = useServerFn(updateOrderStatus);
  const revenue = orders.filter((o) => o.payment_status === "paid").reduce((s, o) => s + o.total_amount, 0);
  const cards = [[ShoppingCart, "Total Pesanan", orders.length], [Package, "Menunggu", orders.filter((o) => o.status === "pending_payment").length], [CheckCircle2, "Selesai", orders.filter((o) => o.status === "completed").length], [Wallet, "Pendapatan", rupiah(revenue)]] as const;
  return <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <p className="font-bold text-primary">Control Room</p><h1 className="text-4xl font-black">Dashboard Admin</h1>
    <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(([Icon, label, value]) => <div key={label} className="rounded-2xl border border-border bg-card p-5 shadow-soft"><Icon className="text-primary" /><p className="mt-3 text-sm text-muted-foreground">{label}</p><p className="text-2xl font-black">{value}</p></div>)}</div>
    <Tabs defaultValue="orders" className="mt-8">
      <TabsList className="flex h-auto flex-wrap justify-start"><TabsTrigger value="orders">Pesanan</TabsTrigger><TabsTrigger value="products">Produk & Paket</TabsTrigger><TabsTrigger value="categories">Kategori</TabsTrigger><TabsTrigger value="pricing">Harga</TabsTrigger><TabsTrigger value="logins">Data Login</TabsTrigger><TabsTrigger value="notifs">Notifikasi</TabsTrigger></TabsList>

      <TabsContent value="orders"><div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft"><table className="w-full min-w-[860px] text-left text-sm"><thead className="bg-muted"><tr><th className="p-4">Pesanan</th><th>Pelanggan</th><th>Item</th><th>Total</th><th>Pembayaran</th><th className="pr-4">Status</th></tr></thead><tbody>{orders.map((o) => <tr key={o.id} className="border-t border-border align-top"><td className="p-4 font-bold">{o.order_number}{o.notes && <p className="mt-1 text-xs font-normal text-muted-foreground">“{o.notes}”</p>}</td><td className="py-4">{o.customers?.roblox_display_name}<br /><span className="text-xs text-muted-foreground">@{o.customers?.roblox_username} · {o.customers?.whatsapp}</span></td><td className="py-4 text-xs">{o.order_items.map((i, k) => <div key={k}>{i.product_name}{i.variant_name ? ` (${i.variant_name})` : ""} ×{i.quantity}</div>)}</td><td className="py-4">{rupiah(o.total_amount)}</td><td className="py-4">{statusLabel[o.payment_status]}</td><td className="py-4 pr-4"><select value={o.status} onChange={async (e) => { const status = e.target.value as typeof o.status; const paymentStatus = ["paid", "payment_confirmed", "processing", "completed"].includes(status) ? "paid" : o.payment_status; try { await statusFn({ data: { id: o.id, status: status as never, paymentStatus: paymentStatus as never } }); setOrders((cur) => cur.map((x) => x.id === o.id ? { ...x, status, payment_status: paymentStatus } : x)); toast.success("Status diperbarui"); } catch (err) { toast.error(msg(err)); } }} className="rounded-lg border border-input bg-background px-2 py-2">{["pending_payment", "paid", "payment_confirmed", "processing", "completed", "cancelled", "expired"].map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}</select></td></tr>)}</tbody></table>{!orders.length && <p className="p-8 text-center text-muted-foreground">Belum ada pesanan.</p>}</div></TabsContent>

      <TabsContent value="products"><div className="grid gap-4 lg:grid-cols-2">{d.products.map((p) => <ProductEditor key={p.id} product={p} variants={d.variants.filter((v) => v.product_id === p.id)} />)}</div></TabsContent>

      <TabsContent value="categories"><div className="grid gap-3 md:grid-cols-2">{d.categories.map((c) => <CategoryEditor key={c.id} cat={c} parent={d.categories.find((x) => x.id === c.parent_id)?.name} />)}</div></TabsContent>

      <TabsContent value="pricing"><div className="grid gap-4 md:grid-cols-2">{d.rules.map((r) => <RuleEditor key={r.key} rule={r} />)}</div></TabsContent>

      <TabsContent value="logins"><LoginList initial={d.credentials} /></TabsContent>

      <TabsContent value="notifs"><div className="overflow-x-auto rounded-2xl border border-border bg-card"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-muted"><tr><th className="p-4">Waktu</th><th>Pesanan</th><th>Saluran</th><th>Status</th><th>Keterangan</th></tr></thead><tbody>{d.notifications.map((n) => <tr key={n.id} className="border-t border-border"><td className="p-4">{new Date(n.created_at).toLocaleString("id-ID")}</td><td>{n.orders?.order_number}</td><td className="capitalize">{n.channel}</td><td className={n.status === "sent" ? "font-bold text-success" : n.status === "failed" ? "font-bold text-destructive" : "text-muted-foreground"}>{n.status === "sent" ? "Terkirim" : n.status === "failed" ? "Gagal" : "Dilewati"}</td><td className="text-xs text-muted-foreground">{n.error}</td></tr>)}</tbody></table>{!d.notifications.length && <p className="p-8 text-center text-muted-foreground">Belum ada notifikasi. Notifikasi dikirim otomatis saat pesanan lunas.</p>}</div></TabsContent>
    </Tabs>
  </main>;
}

type P = ReturnType<typeof Route.useLoaderData>["products"][number];
type V = ReturnType<typeof Route.useLoaderData>["variants"][number];
function ProductEditor({ product, variants }: { product: P; variants: V[] }) {
  const fn = useServerFn(updateProduct);
  const [f, setF] = useState({ name: product.name, basePrice: product.base_price, stock: product.stock, status: product.status });
  return <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
    <p className="text-xs font-bold text-primary">{product.categories?.name} · {product.pricing_type}</p>
    <div className="mt-2 grid grid-cols-2 gap-2"><Input className="col-span-2" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /><label className="text-xs">Harga dasar<Input type="number" value={f.basePrice} onChange={(e) => setF({ ...f, basePrice: +e.target.value })} /></label><label className="text-xs">Stok<Input type="number" value={f.stock} onChange={(e) => setF({ ...f, stock: +e.target.value })} /></label><select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as typeof f.status })} className="rounded-md border border-input bg-background px-2 text-sm"><option value="active">Aktif</option><option value="draft">Draft</option><option value="archived">Arsip</option></select><Button size="sm" onClick={async () => { try { await fn({ data: { id: product.id, ...f } }); toast.success("Produk disimpan"); } catch (e) { toast.error(msg(e)); } }}>Simpan</Button></div>
    {variants.length > 0 && <div className="mt-4 space-y-2 border-t border-border pt-3"><p className="text-xs font-black">Paket</p>{variants.map((v) => <VariantRow key={v.id} v={v} />)}</div>}
  </div>;
}
function VariantRow({ v }: { v: V }) {
  const fn = useServerFn(updateVariant);
  const [f, setF] = useState({ price: v.price, stock: v.stock, active: v.active });
  return <div className="grid grid-cols-[1fr_90px_70px_auto_auto] items-center gap-2 text-xs"><span className="font-bold">{v.name}</span><Input type="number" value={f.price} onChange={(e) => setF({ ...f, price: +e.target.value })} /><Input type="number" value={f.stock} onChange={(e) => setF({ ...f, stock: +e.target.value })} /><label className="flex items-center gap-1"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />Aktif</label><Button size="sm" variant="outline" onClick={async () => { try { await fn({ data: { id: v.id, ...f } }); toast.success("Paket disimpan"); } catch (e) { toast.error(msg(e)); } }}>Simpan</Button></div>;
}
function CategoryEditor({ cat, parent }: { cat: { id: string; name: string; slug: string; active: boolean }; parent?: string }) {
  const fn = useServerFn(updateCategory);
  const [f, setF] = useState({ name: cat.name, active: cat.active });
  return <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-4"><div className="flex-1"><p className="text-xs text-muted-foreground">{parent ? `${parent} → ` : "Kategori utama"} · /{cat.slug}</p><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="mt-1" /></div><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />Aktif</label><Button size="sm" onClick={async () => { try { await fn({ data: { id: cat.id, ...f } }); toast.success("Kategori disimpan"); } catch (e) { toast.error(msg(e)); } }}>Simpan</Button></div>;
}
function RuleEditor({ rule }: { rule: { key: string; name: string; rate: number; unit: number; minimum_amount: number; increment: number } }) {
  const fn = useServerFn(updatePricingRule);
  const [f, setF] = useState({ rate: rule.rate, unit: rule.unit, minimumAmount: rule.minimum_amount, increment: rule.increment });
  const field = (k: keyof typeof f, label: string) => <label className="text-xs">{label}<Input type="number" value={f[k]} onChange={(e) => setF({ ...f, [k]: +e.target.value })} /></label>;
  return <div className="rounded-2xl border border-border bg-card p-5 shadow-soft"><h3 className="font-black">{rule.name}</h3><p className="text-xs text-muted-foreground">Harga = jumlah × tarif ÷ per-unit. Contoh saat ini: {rupiah(Math.ceil((f.minimumAmount * f.rate) / f.unit))} untuk minimum.</p><div className="mt-3 grid grid-cols-2 gap-2">{field("rate", "Tarif (Rp)")}{field("unit", "Per jumlah")}{field("minimumAmount", "Minimum")}{field("increment", "Kelipatan")}</div><Button className="mt-3" size="sm" onClick={async () => { try { await fn({ data: { key: rule.key, ...f } }); toast.success("Harga disimpan"); } catch (e) { toast.error(msg(e)); } }}>Simpan</Button></div>;
}
function LoginList({ initial }: { initial: ReturnType<typeof Route.useLoaderData>["credentials"] }) {
  const fn = useServerFn(clearCredentials);
  const [list, setList] = useState(initial);
  if (!list.length) return <p className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">Belum ada data login.</p>;
  return <div className="grid gap-3 md:grid-cols-2">{list.map((c) => <div key={c.order_id} className="rounded-2xl border border-border bg-card p-5 text-sm shadow-soft"><div className="flex justify-between"><b>{c.orders?.order_number}</b><span className="text-xs text-muted-foreground">{c.orders ? statusLabel[c.orders.payment_status] : ""}</span></div><dl className="mt-3 grid gap-1"><div>Username: <b>{c.roblox_username}</b></div><div>Password: <b className="font-mono">{c.roblox_password ?? "— dihapus —"}</b></div><div>Kode cadangan: <b className="font-mono">{c.backup_code ?? "—"}</b></div></dl>{c.status !== "cleared" && <Button size="sm" variant="destructive" className="mt-3" onClick={async () => { try { await fn({ data: { orderId: c.order_id } }); setList((l) => l.map((x) => x.order_id === c.order_id ? { ...x, roblox_password: null, backup_code: null, status: "cleared" } : x)); toast.success("Data login dihapus"); } catch (e) { toast.error(msg(e)); } }}>Hapus password & kode</Button>}</div>)}</div>;
}
