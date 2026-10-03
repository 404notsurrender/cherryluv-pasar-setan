import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Cherry, Clock3, HeartHandshake, ShieldCheck, Sparkles, Star, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/product-card";
import { getStorefront } from "@/lib/commerce.functions";
import heroImage from "@/assets/mdz-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "MDZ Store — Item Roblox, Cepat & Aman" },
    { name: "description", content: "Penyedia Item All map di Roblox" },
    { property: "og:title", content: "MDZ Store — Item Roblox" },
    { property: "og:description", content: "Item Roblox, Cepat & Aman." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ]}),
  loader: () => getStorefront(), component: HomePage,
});

function HomePage() {
  const { products, categories } = Route.useLoaderData();
  const tops = categories.filter((c) => !c.parent_id);
  return <main>
    <section className="relative isolate min-h-[680px] overflow-hidden bg-footer text-footer-foreground lg:min-h-[760px]">
      <img src={heroImage} width={1600} height={1008} alt="Maskot MDZ Store" className="absolute inset-0 h-full w-full object-cover object-[64%_center]" />
      <div className="absolute inset-0 bg-gradient-to-r from-footer via-footer/85 to-footer/10" />
      <div className="relative mx-auto flex min-h-[680px] max-w-7xl items-center px-4 pb-24 pt-16 sm:px-6 lg:min-h-[760px] lg:px-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/10 px-4 py-2 text-sm font-bold backdrop-blur"><Sparkles className="size-4 text-primary" /> Marketplace penyedia item Roblox</div>
          <h1 className="mt-6 text-5xl font-black leading-[.95] sm:text-7xl lg:text-8xl">MDZ<br/><span className="text-primary">Store</span></h1>
          <p className="mt-5 text-xl font-extrabold sm:text-2xl">Jual Item Roblox</p>
          <p className="mt-3 max-w-lg text-base leading-7 text-footer-muted sm:text-lg">Item Roblox, Cepat & Aman. Pilih item favoritmu, checkout praktis, lalu tim kami langsung memproses pesanan.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg" className="h-12 rounded-full px-6 shadow-pink"><Link to="/shop" search={{}}>Belanja Sekarang <ArrowRight /></Link></Button><Button asChild size="lg" variant="outline" className="h-12 rounded-full border-footer-muted/50 bg-background/10 px-6 text-footer-foreground hover:bg-background/20"><Link to="/shop" search={{}}>Lihat Semua Item</Link></Button></div>
        </div>
      </div>
      <span className="sparkle absolute right-[8%] top-24 text-primary"><Star className="size-8 fill-current" /></span>
    </section>

    <section className="relative z-10 mx-auto -mt-14 grid max-w-6xl grid-cols-2 gap-3 px-4 sm:px-6 lg:grid-cols-4">
      {([{Icon:Clock3,title:"Proses Cepat",copy:"Mulai 10 menit"},{Icon:Tags,title:"Harga Bersahabat",copy:"Paket hemat"},{Icon:HeartHandshake,title:"Pelayanan Ramah",copy:"Admin responsif"},{Icon:ShieldCheck,title:"Transaksi Aman",copy:"Data terlindungi"}]).map(({Icon,title,copy}) => <div key={title} className="rounded-2xl border border-border bg-card p-4 shadow-float sm:p-5"><Icon className="size-6 text-primary"/><h3 className="mt-3 text-base font-black">{title}</h3><p className="text-xs text-muted-foreground sm:text-sm">{copy}</p></div>)}
    </section>

    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8"><div className="flex items-end justify-between gap-4"><div><p className="font-bold text-primary">Rekomendasi untukmu</p><h2 className="mt-1 text-3xl font-black sm:text-4xl">Item paling dicari</h2></div><Button asChild variant="ghost" className="hidden sm:inline-flex"><Link to="/shop" search={{}}>Semua item <ArrowRight /></Link></Button></div><div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.filter((p) => p.featured).slice(0,4).map((product) => <ProductCard key={product.id} product={product} />)}</div></section>

    <section className="bg-secondary/60 py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="text-center"><p className="font-bold text-primary">Semua kebutuhanmu</p><h2 className="mt-1 text-3xl font-black sm:text-4xl">Jelajahi kategori</h2></div><div className="mt-9 grid gap-4 md:grid-cols-3">{tops.map((c) => <Link key={c.id} to="/kategori/$slug" params={{ slug: c.slug }} className="group rounded-3xl border border-border bg-card p-7 shadow-soft transition hover:-translate-y-1 hover:border-primary"><span className="grid size-14 place-items-center rounded-2xl bg-accent text-primary"><Cherry /></span><h3 className="mt-4 text-xl font-black">{c.name}</h3><p className="mt-1 text-sm text-muted-foreground">{c.description ?? `${categories.filter((x) => x.parent_id === c.id).length} sub-kategori`}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">Lihat item <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span></Link>)}</div></div></section>

    <section className="mx-auto grid max-w-7xl gap-14 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:px-8"><div><p className="font-bold text-primary">Mudah dan jelas</p><h2 className="mt-1 text-3xl font-black sm:text-4xl">Tiga langkah, item sampai</h2><div className="mt-8 space-y-5">{[["01","Pilih item","Cari item kamu dan tentukan jumlahnya."],["02","Isi data akun","Masukkan username Roblox dan metode pembayaran."],["03","Tunggu Handler","Handler memverifikasi lalu mengirim item ke akunmu."]].map(([n,t,c]) => <div key={n} className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary font-black text-primary-foreground">{n}</span><div><h3 className="text-lg font-black">{t}</h3><p className="text-sm text-muted-foreground">{c}</p></div></div>)}</div></div><div className="rounded-3xl bg-footer p-7 text-footer-foreground shadow-float sm:p-10"><BadgeCheck className="size-10 text-primary"/><h2 className="mt-5 text-3xl font-black">Disukai pemain Pasar Setan</h2><p className="mt-3 leading-7 text-footer-muted">“Prosesnya cepet banget, adminnya ramah dan Koin langsung masuk. Packaging websitenya juga gemes!”</p><div className="mt-5 flex gap-1 text-primary">{Array.from({length:5}).map((_,i)=><Star key={i} className="size-5 fill-current"/>)}</div><p className="mt-2 text-sm font-bold">Naya · pembelian terverifikasi</p></div></section>

    <section className="mx-auto max-w-4xl px-4 pb-10 sm:px-6"><div className="text-center"><p className="font-bold text-primary">Pertanyaan umum</p><h2 className="text-3xl font-black">Sebelum kamu belanja</h2></div><div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card px-6 shadow-soft">{[["Berapa lama item diproses?","Umumnya 10–30 menit setelah pembayaran dikonfirmasi, tergantung antrean dan stok."],["Apakah aman?","Ya. Harga dihitung dari katalog kami dan data pesanan hanya bisa diakses akunmu serta admin resmi."],["Bagaimana jika username salah?","Segera hubungi admin sebelum pesanan masuk tahap diproses agar data dapat diperiksa."],["Bisa cek status pesanan?","Bisa. Gunakan nomor pesanan dan username Roblox atau nomor WhatsApp di halaman Cek Pesanan."]].map(([q,a]) => <details key={q} className="group py-5"><summary className="cursor-pointer list-none font-black">{q}<span className="float-right text-primary">＋</span></summary><p className="mt-3 pr-8 text-sm leading-6 text-muted-foreground">{a}</p></details>)}</div></section>
  </main>;
}