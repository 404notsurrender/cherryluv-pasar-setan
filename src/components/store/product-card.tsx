import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { imageFor, rupiah, type Product } from "@/lib/store-data";
import { useStore } from "./store-context";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useStore();
  const navigate = useNavigate();
  const variants = [...(product.product_variants ?? [])].sort((a, b) => a.price - b.price);
  const first = variants[0] ?? null;
  const price = first?.price ?? product.base_price;
  const add = () => { addItem(product, first, 1); toast.success(`${product.name} masuk keranjang`); };
  const buy = () => { add(); navigate({ to: "/keranjang" }); };
  return <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-float">
    <Link to="/produk/$slug" params={{ slug: product.slug }} className="block overflow-hidden bg-secondary">
      <div className="relative aspect-square overflow-hidden">
        <img src={imageFor(product.image_key)} width={912} height={912} loading="lazy" alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-bold text-primary shadow-sm backdrop-blur">{product.stock > 0 ? `Stok ${product.stock}` : "Habis"}</span>
      </div>
    </Link>
    <div className="p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-primary">{product.categories?.name ?? "Pasar Setan"}</p>
      <Link to="/produk/$slug" params={{ slug: product.slug }}><h3 className="mt-1 text-lg font-extrabold text-foreground transition group-hover:text-primary">{product.name}</h3></Link>
      <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{product.description}</p>
      <div className="mt-4 flex items-end justify-between gap-2"><div><span className="text-xs text-muted-foreground">Mulai</span><p className="text-lg font-black text-foreground">{rupiah(price)}</p></div><span className="flex items-center gap-1 text-xs font-semibold text-success"><Zap className="size-3" /> {product.delivery_minutes} mnt</span></div>
      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2"><Button onClick={add} className="h-10 rounded-xl"><ShoppingBag /> Tambah</Button><Button onClick={buy} variant="outline" size="icon" className="h-10 w-10 rounded-xl" title="Beli sekarang"><Zap /></Button></div>
    </div>
  </article>;
}