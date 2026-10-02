import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const payload = z.object({
  order_id: z.string().trim().regex(/^CLM-\d{8}-\d{4,}$/),
  amount: z.coerce.number().int().positive(),
  project: z.string().optional(),
  status: z.string(),
  payment_method: z.string().optional(),
}).passthrough();

// Pakasir webhook. The payload is unsigned, so it is only a hint:
// we re-verify every payment directly with Pakasir before marking PAID.
export const Route = createFileRoute("/api/public/webhooks/pakasir")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try { body = await request.json(); } catch { return new Response("Bad JSON", { status: 400 }); }
        const parsed = payload.safeParse(body);
        if (!parsed.success) return new Response("Invalid payload", { status: 400 });
        const p = parsed.data;
        if (p.project && p.project !== "pasar-setan") return new Response("Wrong project", { status: 400 });
        if (p.status.toLowerCase() !== "completed") return new Response("ignored");
        if (p.payment_method && p.payment_method.toLowerCase() !== "qris") return new Response("Wrong method", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: order } = await supabaseAdmin.from("orders")
          .select("order_number, total_amount, payment_status").eq("order_number", p.order_id).maybeSingle();
        if (!order) return new Response("Order not found", { status: 404 });
        if (order.total_amount !== p.amount) return new Response("Amount mismatch", { status: 400 });
        if (order.payment_status === "paid") return new Response("ok"); // duplicate delivery

        const { verifyPakasirPaid } = await import("@/lib/pakasir.server");
        const v = await verifyPakasirPaid(order.order_number, order.total_amount);
        if (!v.paid) return new Response("Not verified", { status: 400 });

        const { data: newlyPaid, error } = await supabaseAdmin.rpc("mark_order_paid", {
          p_order_number: order.order_number, p_amount: order.total_amount,
          p_reference: { webhook: p, verification: v.raw } as never,
        });
        if (error) { console.error("mark_order_paid failed", error.message); return new Response("Error", { status: 500 }); }
        if (newlyPaid) { const { notifyOrderPaid } = await import("@/lib/notify.server"); await notifyOrderPaid(order.order_number).catch(() => {}); }
        return new Response("ok");
      },
    },
  },
});
