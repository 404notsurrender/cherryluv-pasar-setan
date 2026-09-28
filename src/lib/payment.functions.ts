import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const input = z.object({ orderNumber: z.string().trim().regex(/^CLM-\d{8}-\d{4,}$/) });

type Ctx = { supabase: any; userId: string };

async function loadOwnOrder(ctx: Ctx, orderNumber: string) {
  // RLS guarantees the caller owns the order (or is admin)
  const { data, error } = await ctx.supabase.from("orders")
    .select("id, order_number, total_amount, status, payment_status, expires_at, paid_at, payments(qr_string, expires_at, transaction_id, status)")
    .eq("order_number", orderNumber).maybeSingle();
  if (error || !data) throw new Error("Pesanan tidak ditemukan.");
  return data as {
    id: string; order_number: string; total_amount: number; status: string; payment_status: string;
    expires_at: string | null; paid_at: string | null;
    payments: { qr_string: string | null; expires_at: string | null; transaction_id: string | null; status: string }[] | { qr_string: string | null; expires_at: string | null; transaction_id: string | null; status: string } | null;
  };
}

function shape(o: Awaited<ReturnType<typeof loadOwnOrder>>) {
  const p = Array.isArray(o.payments) ? o.payments[0] : o.payments;
  return {
    orderNumber: o.order_number, totalAmount: o.total_amount, status: o.status, paymentStatus: o.payment_status,
    qrString: o.payment_status === "pending" ? p?.qr_string ?? null : null,
    expiresAt: o.expires_at, paidAt: o.paid_at,
  };
}

/** Creates (or reuses) the Pakasir QRIS transaction for the caller's own order. */
export const startPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => input.parse(v))
  .handler(async ({ data, context }) => {
    const order = await loadOwnOrder(context, data.orderNumber);
    const p = Array.isArray(order.payments) ? order.payments[0] : order.payments;
    const stillValid = p?.qr_string && order.expires_at && new Date(order.expires_at).getTime() > Date.now();
    if (order.payment_status !== "pending" || stillValid) return shape(order);

    const { createPakasirTransaction } = await import("./pakasir.server");
    // Amount comes from the database, never from the browser
    const tx = await createPakasirTransaction(order.order_number, order.total_amount);
    const expiresAt = tx.expiresAt ?? new Date(Date.now() + 30 * 60_000).toISOString();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("payments").update({
      qr_string: tx.qrString, expires_at: expiresAt, transaction_id: tx.transactionId,
      provider_reference: tx.transactionId, raw_reference: tx.raw as never, updated_at: new Date().toISOString(),
    }).eq("order_id", order.id);
    await supabaseAdmin.from("orders").update({
      payment_transaction_id: tx.transactionId, expires_at: expiresAt, updated_at: new Date().toISOString(),
    }).eq("id", order.id);

    return shape(await loadOwnOrder(context, data.orderNumber));
  });

/** Polled by the payment page. With verify=true it asks Pakasir server-side. */
export const getPaymentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => input.extend({ verify: z.boolean().optional().default(false) }).parse(v))
  .handler(async ({ data, context }) => {
    let order = await loadOwnOrder(context, data.orderNumber);
    if (order.payment_status === "pending") {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      if (data.verify) {
        const { verifyPakasirPaid } = await import("./pakasir.server");
        const r = await verifyPakasirPaid(order.order_number, order.total_amount);
        if (r.paid) await supabaseAdmin.rpc("mark_order_paid", { p_order_number: order.order_number, p_amount: order.total_amount, p_reference: r.raw as never });
      }
      await supabaseAdmin.rpc("expire_order", { p_order_number: order.order_number });
      order = await loadOwnOrder(context, data.orderNumber);
    }
    return shape(order);
  });
