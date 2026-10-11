import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle();
    if (error) throw new Error("Profil belum dapat dimuat.");
    const email = (context.claims as { email?: string }).email ?? "";
    return { email, profile: data };
  });

const opt = (max: number) => z.string().trim().max(max).transform((v) => v || null);
const profileSchema = z.object({
  display_name: opt(60),
  roblox_username: z.string().trim().max(20).regex(/^[A-Za-z0-9_]*$/, "Username Roblox hanya huruf, angka, dan _").transform((v) => v || null),
  roblox_display_name: opt(30),
  whatsapp: z.string().trim().regex(/^(\+?62|0)?[0-9]{0,14}$/, "Nomor WhatsApp tidak valid").transform((v) => v || null),
  discord_username: opt(40),
});
export type ProfileInput = z.input<typeof profileSchema>;

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => profileSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("profiles")
      .upsert({ id: context.userId, ...data, updated_at: new Date().toISOString() });
    if (error) throw new Error("Profil gagal disimpan.");
    return { ok: true };
  });
