// Server-only: sends Telegram / Discord alerts once an order is confirmed paid.
import { rupiah } from "./store-data";

export async function notifyOrderPaid(orderNumber: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: o } = await supabaseAdmin.from("orders")
    .select("id, order_number, total_amount, notes, customers(roblox_username, roblox_display_name, whatsapp, discord_username), order_items(product_name, variant_name, quantity, subtotal)")
    .eq("order_number", orderNumber).maybeSingle();
  if (!o) return;
  const c = o.customers as { roblox_username: string; roblox_display_name: string; whatsapp: string; discord_username: string | null } | null;
  const items = (o.order_items ?? []).map((i) => `• ${i.product_name}${i.variant_name ? ` (${i.variant_name})` : ""} ×${i.quantity} — ${rupiah(i.subtotal)}`).join("\n");
  const message = `✅ PESANAN LUNAS ${o.order_number}\nTotal: ${rupiah(o.total_amount)}\nRoblox: @${c?.roblox_username ?? "-"} (${c?.roblox_display_name ?? "-"})\nWhatsApp: ${c?.whatsapp ?? "-"}${c?.discord_username ? `\nDiscord: ${c.discord_username}` : ""}\n\n${items}${o.notes ? `\n\nCatatan: ${o.notes}` : ""}`;

  const channels: { name: string; send: (() => Promise<Response>) | null }[] = [
    {
      name: "telegram",
      send: process.env["TELEGRAM_BOT_TOKEN"] && process.env["TELEGRAM_CHAT_ID"]
        ? () => fetch(`https://api.telegram.org/bot${process.env["TELEGRAM_BOT_TOKEN"]}/sendMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: process.env["TELEGRAM_CHAT_ID"], text: message }),
          })
        : null,
    },
    {
      name: "discord",
      send: process.env["DISCORD_WEBHOOK_URL"]
        ? () => fetch(process.env["DISCORD_WEBHOOK_URL"]!, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: message.slice(0, 1900) }),
          })
        : null,
    },
  ];

  for (const ch of channels) {
    let status = "skipped"; let error: string | null = null;
    if (ch.send) {
      try { const r = await ch.send(); status = r.ok ? "sent" : "failed"; if (!r.ok) error = `HTTP ${r.status}`; }
      catch (e) { status = "failed"; error = e instanceof Error ? e.message : "error"; }
    } else error = "Belum dikonfigurasi";
    await supabaseAdmin.from("notifications").insert({ order_id: o.id, channel: ch.name, status, message, error, sent_at: status === "sent" ? new Date().toISOString() : null });
  }
}
