import { useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, ChevronRight, Clock3, KeyRound, Minus, Plus, ShieldCheck, ShoppingBag, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProduct } from "@/lib/commerce.functions";
import { dynamicPrice, formatNumber, imageFor, isDynamic, rupiah } from "@/lib/store-data";
import { useStore } from "@/components/store/store-context";
import { toast } from "sonner";

export const Route = createFileRoute("/produk/$slug")({
  loader: async ({ params }) => { const product = await getProduct({ data: { slug: params.slug } }); if (!product) throw notFound(); return product; },
  head: ({ loaderData }) => ({ meta: [{ title: loaderData ? `${loaderData.name} — MDZ Store` : "Produk tidak ditemukan" }, { name: "description", content: loaderData?.description ?? "Item tidak ditemukan." }, { property: "og:title", content: loaderData?.name ?? "MDZ Store" }, { property: "og:description", content: loaderData?.description ?? "Item Roblox." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  notFoundComponent: () => <div className="mx-auto max-w-xl px-4 py-32 text-center"><h1 className="text-3xl font-black">Item tidak ditemukan</h1><p className="mt-2 text-muted-foreground">Mungkin item ini sedang pindah lapak.</p></div>,
  errorComponent: () => <div className="mx-auto max-w-xl px-4 py-32 text-center"><h1 className="text-3xl font-black">Produk belum dapat dimuat</h1></div>,
  component: ProductPage,
});

function ProductPage() {
  const product = Route.useLoaderData();
  const variants = [...(product.product_variants ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const [selected, setSelected] = useState(variants[0] ?? null);
  const [qty, setQty] = useState(1);
  const rule = product.pricing_rule ?? null;
  const dynamic = isDynamic(product) && rule;
  const unitLabel = product.pricing_type === "koin" ? "Koin" : "Robux";
  const [amountText, setAmountText] = useState(String(rule?.minimum_amount ?? 0));
  const amount = Number(amountText.replace(/\D/g, "")) || 0;
  const amountValid = !!rule && amount >= rule.minimum_amount && (amount - rule.minimum_amount) % rule.increment === 0;
  const isLogin = product.pricing_type === "robux_login";
  const { addItem } = useStore();
  const nav = useNavigate();
  const price = dynamic ? (amountValid ? dynamicPrice(amount, rule) : 0) : (selected?.price ?? product.base_price) * qty;
  const add = () => {
    if (dynamic) {
      if (!amountValid) { toast.error(`Minimal ${formatNumber(rule.minimum_amount)} ${unitLabel}, kelipatan ${formatNumber(rule.increment)}.`); return false; }
      addItem(product, null, 1, { amount, estimate: dynamicPrice(amount, rule) });
    } else addItem(product, selected, isLogin ? 1 : qty);
    toast.success("Item ditambahkan ke keranjang"); return true;
  };
  const parent = product.parent_category;
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
      <Link to="/" className="hover:text-primary">Home</Link>
      {parent && <><ChevronRight className="size-4" /><Link to="/kategori/$slug" params={{ slug: parent.slug }} className="hover:text-primary">{parent.name}</Link></>}
      {product.categories && <><ChevronRight className="size-4" /><Link to="/kategori/$slug" params={{ slug: product.categories.slug }} className="hover:text-primary">{product.categories.name}</Link></>}
      <ChevronRight className="size-4" /><span className="font-bold text-foreground">{product.name}</span>
    </nav>
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="overflow-hidden rounded-3xl bg-secondary shadow-soft"><img src={imageFor(product.image_key)} width={912} height={912} alt={product.name} className="aspect-square h-full w-full object-cover" /></div>
      <div className="lg:py-5">
        <p className="font-bold text-primary">{product.categories?.name}</p>
        <h1 className="mt-2 text-4xl font-black sm:text-5xl">{product.name}</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">{product.description}</p>
        <div className="mt-6 flex items-center gap-4"><p className="text-3xl font-black">{rupiah(price)}</p><span className="rounded-full bg-success/10 px-3 py-1 text-sm font-bold text-success">Stok tersedia</span></div>
        {dynamic ? <div className="mt-7">
          <label htmlFor="amount" className="mb-3 block text-sm font-black">Jumlah {unitLabel}</label>
          <Input id="amount" inputMode="numeric" value={amount ? formatNumber(amount) : ""} onChange={(e) => setAmountText(e.target.value)} className="h-12 max-w-xs rounded-xl text-lg font-black" />
          <p className={`mt-2 text-xs ${amountValid ? "text-muted-foreground" : "text-destructive"}`}>Minimal {formatNumber(rule.minimum_amount)} {unitLabel}, kelipatan {formatNumber(rule.increment)}. Harga {rupiah(rule.rate)} per {formatNumber(rule.unit)} {unitLabel}.</p>
          <div className="mt-3 flex flex-wrap gap-2">{[1, 2, 5, 10].map((m) => { const v = rule.minimum_amount * m; return <button key={m} onClick={() => setAmountText(String(v))} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold hover:border-primary">{formatNumber(v)}</button>; })}</div>
        </div> : <>
          {variants.length > 0 && <div className="mt-7"><p className="mb-3 text-sm font-black">Pilih paket</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{variants.map((v) => <button key={v.id} onClick={() => setSelected(v)} className={`rounded-xl border p-3 text-left transition ${selected?.id === v.id ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card"}`}><b className="block text-sm">{v.name}</b><span className="text-xs">{rupiah(v.price)}</span></button>)}</div></div>}
          {!isLogin && <div className="mt-7"><p className="mb-3 text-sm font-black">Jumlah</p><div className="flex w-fit items-center rounded-xl border border-border bg-card"><Button variant="ghost" size="icon" onClick={() => setQty(Math.max(1, qty - 1))}><Minus /></Button><span className="w-12 text-center font-black">{qty}</span><Button variant="ghost" size="icon" onClick={() => setQty(Math.min(99, qty + 1))}><Plus /></Button></div></div>}
        </>}
        {isLogin && <div className="mt-6 flex gap-3 rounded-2xl border border-primary/30 bg-accent/50 p-4 text-sm"><KeyRound className="size-5 shrink-0 text-primary" /><p>Data login Roblox (username, password, dan kode cadangan) diminta saat checkout. Data hanya bisa dilihat admin dan dihapus setelah pesanan selesai.</p></div>}
        <div className="mt-7 grid gap-3 sm:grid-cols-2"><Button size="lg" className="h-12 rounded-xl" onClick={add}><ShoppingBag />Tambah ke Keranjang</Button><Button size="lg" variant="outline" className="h-12 rounded-xl" onClick={() => { if (add()) nav({ to: "/keranjang" }); }}><Zap />Beli Sekarang</Button></div>
        <div className="mt-8 grid gap-3 rounded-2xl bg-muted p-5 text-sm"><p className="flex items-center gap-2 font-bold"><Clock3 className="size-4 text-primary" />Estimasi proses {product.delivery_minutes}–30 menit</p><p className="flex items-center gap-2 font-bold"><ShieldCheck className="size-4 text-primary" />Harga dihitung ulang dan diverifikasi saat checkout</p><p className="flex items-start gap-2 text-muted-foreground"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />{product.instructions}</p></div>
      </div>
    </div>
  </main>;
}
