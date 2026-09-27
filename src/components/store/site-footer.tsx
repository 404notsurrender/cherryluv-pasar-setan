import { Link } from "@tanstack/react-router";
import { Cherry, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteFooter() {
  return <footer className="mt-24 border-t border-border bg-footer text-footer-foreground">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
      <div><div className="flex items-center gap-2 text-xl font-black"><Cherry className="text-primary" /> CherryLuvv Market</div><p className="mt-4 max-w-md text-sm leading-6 text-footer-muted">Tempat belanja item Pasar Setan yang manis, cepat, dan aman. Dibuat khusus untuk pemain Indonesia.</p><p className="mt-5 flex items-center gap-1 text-xs text-footer-muted">Dibuat dengan <Heart className="size-3 fill-primary text-primary" /> untuk warga Pasar Setan.</p></div>
      <div><p className="font-black">Jelajahi</p><div className="mt-4 grid gap-3 text-sm text-footer-muted"><Link to="/shop">Semua Item</Link><Link to="/cek-pesanan">Cek Pesanan</Link><Link to="/akun">Akun Saya</Link></div></div>
      <div><p className="font-black">Butuh bantuan?</p><p className="mt-4 text-sm leading-6 text-footer-muted">Tim Cherry siap membantu proses pesananmu.</p><Button className="mt-4 rounded-full"><MessageCircle /> Hubungi Admin</Button></div>
    </div>
    <div className="border-t border-footer-border py-5 text-center text-xs text-footer-muted">© 2026 CherryLuvv Market · Tidak berafiliasi dengan Roblox Corporation.</div>
  </footer>;
}