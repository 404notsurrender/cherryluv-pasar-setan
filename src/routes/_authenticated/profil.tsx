import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Loader2, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMyProfile, updateMyProfile, type ProfileInput } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/profil")({
  loader: () => getMyProfile(),
  head: () => ({ meta: [
    { title: "Pengaturan Profil — MDZ Store" },
    { name: "description", content: "Atur nama, akun Roblox, WhatsApp, dan Discord kamu." },
    { property: "og:title", content: "Pengaturan Profil — MDZ Store" },
    { property: "og:description", content: "Kelola data profil pelanggan MDZ Store." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ProfilePage,
});

const fields: { key: keyof ProfileInput; label: string; placeholder: string }[] = [
  { key: "display_name", label: "Nama Tampilan", placeholder: "Nama kamu" },
  { key: "roblox_username", label: "Username Roblox", placeholder: "contoh: PlayerKeren123" },
  { key: "roblox_display_name", label: "Display Name Roblox", placeholder: "Nama tampilan di Roblox" },
  { key: "whatsapp", label: "Nomor WhatsApp", placeholder: "08xxxxxxxxxx" },
  { key: "discord_username", label: "Username Discord (opsional)", placeholder: "username" },
];

function ProfilePage() {
  const { email, profile } = Route.useLoaderData();
  const router = useRouter();
  const [form, setForm] = useState<Record<keyof ProfileInput, string>>({
    display_name: profile?.display_name ?? "", roblox_username: profile?.roblox_username ?? "",
    roblox_display_name: profile?.roblox_display_name ?? "", whatsapp: profile?.whatsapp ?? "",
    discord_username: profile?.discord_username ?? "",
  });
  const [saving, setSaving] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await updateMyProfile({ data: form }); toast.success("Profil berhasil disimpan"); router.invalidate(); }
    catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(msg.includes("[") ? "Periksa kembali isian kamu." : msg || "Profil gagal disimpan.");
    } finally { setSaving(false); }
  };
  return <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
    <div className="flex items-center gap-4">
      <span className="grid size-14 place-items-center rounded-2xl bg-secondary text-primary"><Settings /></span>
      <div><p className="font-bold text-primary">Akun pelanggan</p><h1 className="text-3xl font-black">Pengaturan Profil</h1></div>
    </div>
    <form onSubmit={save} className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="space-y-2"><Label>Email</Label><Input value={email} disabled /></div>
      {fields.map((f) => <div key={f.key} className="space-y-2">
        <Label htmlFor={f.key}>{f.label}</Label>
        <Input id={f.key} value={form[f.key]} placeholder={f.placeholder} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
      </div>)}
      <p className="text-xs text-muted-foreground">Data ini dipakai untuk mengisi otomatis form checkout.</p>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>{saving && <Loader2 className="animate-spin" />} Simpan Profil</Button>
        <Button asChild variant="outline"><Link to="/akun">Riwayat Pesanan</Link></Button>
      </div>
    </form>
  </main>;
}
