import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import wolfLogo from "@/assets/wolf-logo.png.asset.json";

export function SiteFooter() {
  return <footer className="mt-24 border-t border-border bg-footer text-footer-foreground">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
      <div><div className="flex items-center gap-2 text-xl font-black"><img src={wolfLogo.url} alt="" className="size-7" /> MDZ Store</div><p className="mt-4 max-w-md text-sm leading-6 text-footer-muted">Tempat item Roblox, cepat, dan aman. Dibuat khusus untuk pemain Indonesia.</p><p className="mt-5 flex items-center gap-1 text-xs text-footer-muted">Dibuat oleh Anak Negeri dengan <Heart className="size-3 fill-primary text-primary" />untuk Pemain Roblox.</p></div>
      <div><p className="font-black">Jelajahi</p><div className="mt-4 grid gap-3 text-sm text-footer-muted"><Link to="/shop" search={{}}>Semua Item</Link><Link to="/cek-pesanan">Cek Pesanan</Link><Link to="/akun">Akun Saya</Link></div></div>
      <div><p className="font-black">Butuh bantuan?</p><p className="mt-4 text-sm leading-6 text-footer-muted">Tim kami siap membantu proses pesananmu.</p><Button className="mt-4 rounded-full"><MessageCircle /> Hubungi Admin</Button></div>
    </div>
    <div className="border-t border-footer-border py-5 text-center text-xs text-footer-muted">© 2026 MDZ Store - PT. Satukan Anak Negeri · Tidak berafiliasi dengan Roblox Corporation.</div>
  </footer>;
}