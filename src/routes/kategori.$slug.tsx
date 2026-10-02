import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronRight, Cherry } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import { getStorefront } from "@/lib/commerce.functions";

export const Route = createFileRoute("/kategori/$slug")({
  loader: async ({ params }) => {
    const data = await getStorefront();
    const category = data.categories.find((c) => c.slug === params.slug);
    if (!category) throw notFound();
    const parent = data.categories.find((c) => c.id === category.parent_id) ?? null;
    const children = data.categories.filter((c) => c.parent_id === category.id);
    const ids = new Set([category.id, ...children.map((c) => c.id)]);
    const products = data.products.filter((p) => ids.has(p.category_id));
    return { category, parent, children, products };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.category.name ?? "Kategori";
    const desc = loaderData?.category.description ?? `Belanja item ${name} dengan cepat dan aman.`;
    return { meta: [{ title: `${name} — MDZ Store` }, { name: "description", content: desc }, { property: "og:title", content: `${name} — MDZ Store` }, { property: "og:description", content: desc }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
  },
  notFoundComponent: () => <div className="mx-auto max-w-xl px-4 py-32 text-center"><h1 className="text-3xl font-black">Kategori tidak ditemukan</h1></div>,
  errorComponent: () => <div className="mx-auto max-w-xl px-4 py-32 text-center"><h1 className="text-3xl font-black">Kategori belum dapat dimuat</h1></div>,
  component: CategoryPage,
});

function CategoryPage() {
  const { category, parent, children, products } = Route.useLoaderData();
  return <main className="min-h-screen">
    <section className="bg-secondary/70 py-12"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">Home</Link>
        {parent && <><ChevronRight className="size-4" /><Link to="/kategori/$slug" params={{ slug: parent.slug }} className="hover:text-primary">{parent.name}</Link></>}
        <ChevronRight className="size-4" /><span className="font-bold text-foreground">{category.name}</span>
      </nav>
      <h1 className="text-4xl font-black sm:text-5xl">{category.name}</h1>
      {category.description && <p className="mt-3 max-w-2xl text-muted-foreground">{category.description}</p>}
    </div></section>
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {children.length > 0 && <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">{children.map((c) => <Link key={c.id} to="/kategori/$slug" params={{ slug: c.slug }} className="rounded-2xl border border-border bg-card p-5 text-center shadow-soft transition hover:-translate-y-1 hover:border-primary"><span className="mx-auto grid size-12 place-items-center rounded-full bg-accent text-primary"><Cherry /></span><h2 className="mt-3 text-sm font-black">{c.name}</h2></Link>)}</div>}
      {products.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div> : <p className="py-20 text-center text-muted-foreground">Belum ada item di kategori ini.</p>}
    </section>
  </main>;
}
