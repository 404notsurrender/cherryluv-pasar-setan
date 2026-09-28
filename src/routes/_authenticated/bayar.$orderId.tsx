import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Clock, Loader2, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getPaymentStatus, startPayment } from "@/lib/payment.functions";
import { rupiah, statusLabel } from "@/lib/store-data";

export const Route = createFileRoute("/_authenticated/bayar/$orderId")({
  head: ({ params }) => ({ meta: [
    { title: `Bayar ${params.orderId} — CherryLuvv Market` },
    { name: "description", content: "Selesaikan pembayaran QRIS pesanan CherryLuvv Market." },
    { property: "og:title", content: "Pembayaran QRIS CherryLuvv" },
    { property: "og:description", content: "Scan QRIS untuk menyelesaikan pesanan item Pasar Setan." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: PayPage,
});

type Pay = Awaited<ReturnType<typeof startPayment>>;

function PayPage() {
  const { orderId } = Route.useParams();
  const start = useServerFn(startPayment);
  const status = useServerFn(getPaymentStatus);
  const [pay, setPay] = useState<Pay | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    start({ data: { orderNumber: orderId } }).then(setPay).catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat pembayaran"));
  }, [orderId]);

  useEffect(() => {
    if (pay?.paymentStatus !== "pending") return;
    const poll = setInterval(() => { status({ data: { orderNumber: orderId, verify: false } }).then(setPay).catch(() => {}); }, 5000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(poll); clearInterval(tick); };
  }, [pay?.paymentStatus, orderId]);

  const check = async () => {
    setChecking(true);
    try {
      const r = await status({ data: { orderNumber: orderId, verify: true } });
      setPay(r);
      if (r.paymentStatus === "paid") toast.success("Pembayaran diterima!");
      else toast.info("Pembayaran belum terdeteksi. Coba lagi setelah beberapa saat.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Gagal cek status"); }
    finally { setChecking(false); }
  };

  if (error) return <main className="mx-auto max-w-lg px-4 py-28 text-center"><XCircle className="mx-auto size-12 text-destructive" /><h1 className="mt-4 text-2xl font-black">{error}</h1><Button asChild className="mt-6"><Link to="/akun">Riwayat Pesanan</Link></Button></main>;
  if (!pay) return <main className="grid min-h-[60vh] place-items-center"><Loader2 className="size-8 animate-spin text-primary" /></main>;

  const left = pay.expiresAt ? Math.max(0, new Date(pay.expiresAt).getTime() - now) : 0;
  const mm = String(Math.floor(left / 60000)).padStart(2, "0");
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");
  const paid = pay.paymentStatus === "paid";
  const pending = pay.paymentStatus === "pending";

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-soft">
        {paid ? <>
          <CheckCircle2 className="mx-auto size-14 text-success" />
          <h1 className="mt-3 text-3xl font-black">Pembayaran Berhasil</h1>
          <p className="mt-2 text-sm text-muted-foreground">Admin akan segera memproses item ke akun Roblox kamu.</p>
        </> : pending ? <>
          <p className="font-bold text-primary">QRIS</p>
          <h1 className="text-3xl font-black">Menunggu Pembayaran</h1>
        </> : <>
          <XCircle className="mx-auto size-14 text-destructive" />
          <h1 className="mt-3 text-3xl font-black">{statusLabel[pay.paymentStatus] ?? pay.paymentStatus}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Waktu pembayaran habis. Silakan buat pesanan baru.</p>
        </>}

        <dl className="mt-6 grid gap-2 rounded-2xl bg-secondary p-4 text-left text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Order ID</dt><dd className="font-black">{pay.orderNumber}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Total pembayaran</dt><dd className="font-black text-primary">{rupiah(pay.totalAmount)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Status</dt><dd className="font-bold">{statusLabel[pay.paymentStatus] ?? pay.paymentStatus}</dd></div>
        </dl>

        {pending && pay.qrString && <>
          <div className="mx-auto mt-6 w-fit rounded-2xl border border-border bg-background p-4"><QRCodeSVG value={pay.qrString} size={232} /></div>
          <p className="mt-4 flex items-center justify-center gap-2 text-sm font-bold"><Clock className="size-4" /> Sisa waktu {mm}:{ss}</p>
          <p className="mt-1 text-xs text-muted-foreground">Scan dengan aplikasi e-wallet atau mobile banking. Status diperbarui otomatis.</p>
          <Button onClick={check} disabled={checking} size="lg" className="mt-5 h-12 w-full rounded-xl">{checking ? <Loader2 className="animate-spin" /> : <RefreshCw />} Cek Status Pembayaran</Button>
        </>}

        <Button asChild variant="ghost" className="mt-3 w-full"><Link to="/pesanan/$orderId" params={{ orderId: pay.orderNumber }}>Lihat detail pesanan</Link></Button>
      </div>
    </main>
  );
}
