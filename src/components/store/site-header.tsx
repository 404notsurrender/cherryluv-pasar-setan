import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Cherry, Menu, ShoppingBag, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "./store-context";

const links = [
  ["Beranda", "/"], ["Belanja", "/shop"], ["Cek Pesanan", "/cek-pesanan"],
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { cartCount, user } = useStore();
  const navigate = useNavigate();
  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };
  return <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
    <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <Link to="/" className="flex items-center gap-2.5" aria-label="CherryLuvv Market">
        <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-pink"><Cherry className="size-5" /></span>
        <span><b className="block text-base font-black leading-none text-foreground">CherryLuvv</b><small className="text-[10px] font-bold uppercase tracking-wide text-primary">Pasar Setan Market</small></span>
      </Link>
      <nav className="hidden items-center gap-7 md:flex">{links.map(([label, to]) => <Link key={to} to={to} className="text-sm font-bold text-muted-foreground transition hover:text-primary" activeProps={{ className: "text-primary" }}>{label}</Link>)}</nav>
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="relative rounded-full" title="Keranjang"><Link to="/keranjang"><ShoppingBag />{cartCount > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">{cartCount}</span>}</Link></Button>
        {user ? <div className="hidden items-center gap-1 md:flex"><Button asChild variant="ghost" className="rounded-full"><Link to="/akun"><UserRound /> Akun</Link></Button><Button variant="ghost" onClick={signOut}>Keluar</Button></div> : <Button asChild className="hidden rounded-full md:inline-flex"><Link to="/auth">Masuk</Link></Button>}
        <Button variant="ghost" size="icon" className="rounded-full md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Buka menu">{open ? <X /> : <Menu />}</Button>
      </div>
    </div>
    {open && <div className="border-t border-border bg-background px-4 py-4 md:hidden"><nav className="grid gap-2">{links.map(([label, to]) => <Button key={to} asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}><Link to={to}>{label}</Link></Button>)}<Button asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}><Link to={user ? "/akun" : "/auth"}>{user ? "Akun Saya" : "Masuk / Daftar"}</Link></Button>{user && <Button variant="ghost" className="justify-start" onClick={signOut}>Keluar</Button>}</nav></div>}
  </header>;
}