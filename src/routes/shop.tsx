import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/store/product-card";
import { getCatalog } from "@/lib/commerce.functions";

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): { category?: string } => ({ category: typeof search["category"] === "string" ? search["category"] : undefined }),
  loader: () => getCatalog(), component: ShopPage,
});

function ShopPage() {
  const products = Route.useLoaderData(); const searchParams = Route.useSearch();
  const [query,setQuery]=useState(""); const [category,setCategory]=useState(searchParams.category ?? "semua"); const [sort,setSort]=useState("popular");
  const categories=["semua","koin","sultan","serpihan-arwah","matengan","dupa","kepiting-sungai"];
  const filtered=useMemo(()=>products.filter((p)=>(category==="semua"||p.categories?.slug===category)&&p.name.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>sort==="low"?a.base_price-b.base_price:sort==="high"?b.base_price-a.base_price:b.popularity-a.popularity),[products,query,category,sort]);
  return <main className="min-h-screen"><section className="bg-secondary/70 py-14"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><p className="font-bold text-primary">Lapak pilihan Cherry</p><h1 className="mt-1 text-4xl font-black sm:text-5xl">Belanja Item Pasar Setan</h1><p className="mt-3 max-w-2xl text-muted-foreground">Semua yang kamu cari untuk menjelajah Pasar Setan, tersedia dalam satu lapak aman.</p></div></section><section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="grid gap-3 md:grid-cols-[1fr_auto]"><label className="relative"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Cari Koin, Sultan, atau item lain..." className="h-12 rounded-xl bg-card pl-11"/></label><label className="flex h-12 items-center gap-2 rounded-xl border border-input bg-card px-4"><SlidersHorizontal className="size-4"/><select value={sort} onChange={(e)=>setSort(e.target.value)} className="bg-transparent text-sm font-bold outline-none"><option value="popular">Paling populer</option><option value="low">Harga terendah</option><option value="high">Harga tertinggi</option></select></label></div><div className="mt-5 flex gap-2 overflow-x-auto pb-2">{categories.map((item)=><button key={item} onClick={()=>setCategory(item)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${category===item?"bg-primary text-primary-foreground shadow-pink":"border border-border bg-card text-muted-foreground hover:border-primary"}`}>{item==="semua"?"Semua":item.split("-").map(x=>(x[0] ?? "").toUpperCase()+x.slice(1)).join(" ")}</button>)}</div>{filtered.length?<div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((product)=><ProductCard key={product.id} product={product}/>)}</div>:<div className="py-28 text-center"><Search className="mx-auto size-10 text-muted-foreground"/><h2 className="mt-4 text-xl font-black">Item tidak ditemukan</h2><p className="text-sm text-muted-foreground">Coba kata kunci atau kategori lain.</p></div>}</section></main>;
}