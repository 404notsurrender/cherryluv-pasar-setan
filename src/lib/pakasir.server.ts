// Server-only Pakasir helpers. Never import from client code.
export const PAKASIR_SLUG = "pasar-setan";

function apiKey() {
  const key = process.env["PAKASIR_API_KEY"];
  if (!key) throw new Error("Pembayaran QRIS belum dikonfigurasi.");
  return key;
}

type AnyRecord = Record<string, unknown>;
const pick = (o: AnyRecord | undefined, ...keys: string[]) => {
  for (const k of keys) if (o && o[k] != null && o[k] !== "") return o[k];
  return undefined;
};

export type PakasirTransaction = { qrString: string; expiresAt: string | null; transactionId: string | null; raw: unknown };

export async function createPakasirTransaction(orderNumber: string, amount: number): Promise<PakasirTransaction> {
  const res = await fetch(`https://app.pakasir.com/api/v2/create-transaction/${PAKASIR_SLUG}/${encodeURIComponent(orderNumber)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Api-Key": apiKey() },
    body: JSON.stringify({ method: "qris", amount }),
  });
  const text = await res.text();
  let body: AnyRecord = {};
  try { body = JSON.parse(text); } catch { /* non-JSON */ }
  if (!res.ok) {
    console.error("Pakasir create failed", res.status, text.slice(0, 300));
    throw new Error("Gagal membuat pembayaran QRIS. Coba lagi sebentar.");
  }
  const p = (pick(body, "payment", "data", "transaction") as AnyRecord | undefined) ?? body;
  const qr = pick(p, "payment_number", "qr_string", "qris_string", "qr");
  if (typeof qr !== "string") {
    console.error("Pakasir response missing QR", text.slice(0, 300));
    throw new Error("QRIS tidak diterima dari penyedia pembayaran.");
  }
  const exp = pick(p, "expired_at", "expires_at", "expiry");
  const txId = pick(p, "txn_id", "transaction_id", "id", "reference");
  return { qrString: qr, expiresAt: typeof exp === "string" ? exp : null, transactionId: txId != null ? String(txId) : null, raw: body };
}

/** Server-to-server verification. Returns true only if Pakasir confirms completed payment for the exact amount. */
export async function verifyPakasirPaid(orderNumber: string, amount: number): Promise<{ paid: boolean; raw: unknown }> {
  const url = new URL("https://app.pakasir.com/api/transactiondetail");
  url.searchParams.set("project", PAKASIR_SLUG);
  url.searchParams.set("amount", String(amount));
  url.searchParams.set("order_id", orderNumber);
  url.searchParams.set("api_key", apiKey());
  const res = await fetch(url, { headers: { "X-Api-Key": apiKey() } });
  if (!res.ok) return { paid: false, raw: null };
  const body = (await res.json().catch(() => ({}))) as AnyRecord;
  const t = (pick(body, "transaction", "data", "payment") as AnyRecord | undefined) ?? body;
  const paid =
    String(pick(t, "status") ?? "").toLowerCase() === "completed" &&
    Number(pick(t, "amount")) === amount &&
    String(pick(t, "order_id") ?? "") === orderNumber &&
    String(pick(t, "payment_method") ?? "qris").toLowerCase() === "qris";
  return { paid, raw: body };
}
