import coinsImage from "@/assets/product-coins.jpg";
import shardsImage from "@/assets/product-shards.jpg";
import foodImage from "@/assets/product-food.jpg";

export type Variant = { id: string; name: string; price: number; stock: number; quantity_value: number; sort_order?: number };
export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_key: string;
  base_price: number;
  stock: number;
  popularity: number;
  delivery_minutes: number;
  instructions: string;
  featured: boolean;
  category_id: string;
  status: "active" | "draft" | "archived";
  pricing_type?: "fixed" | "koin" | "robux_gift" | "robux_login";
  sort_order?: number;
  pricing_rule?: PricingRule | null;
  categories?: { name: string; slug: string } | null;
  product_variants?: Variant[];
};

export type PricingRule = { key: string; name: string; rate: number; unit: number; minimum_amount: number; increment: number };
export const dynamicPrice = (amount: number, rule: PricingRule) => Math.ceil((amount * rule.rate) / rule.unit);
export const isDynamic = (p: Pick<Product, "pricing_type">) => p.pricing_type === "koin" || p.pricing_type === "robux_gift";
export const formatNumber = (n: number) => new Intl.NumberFormat("id-ID").format(n);

export const CATEGORY_NAMES: Record<string, string> = {
  koin: "Koin",
  sultan: "Sultan",
  "serpihan-arwah": "Serpihan Arwah",
  matengan: "Matengan",
  dupa: "Dupa",
  "kepiting-sungai": "Kepiting Sungai",
};

export const imageFor = (key: string) => {
  if (key === "coins") return coinsImage;
  if (key === "shards") return shardsImage;
  return foodImage;
};

export const rupiah = (value: number) => new Intl.NumberFormat("id-ID", {
  style: "currency", currency: "IDR", maximumFractionDigits: 0,
}).format(value);

export const statusLabel: Record<string, string> = {
  pending_payment: "Menunggu Pembayaran",
  payment_confirmed: "Pembayaran Dikonfirmasi",
  processing: "Sedang Diproses",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  refunded_order: "Dikembalikan",
  pending: "Menunggu Pembayaran",
  paid: "Lunas",
  failed: "Gagal",
  refunded: "Dikembalikan",
  expired: "Kedaluwarsa",
};