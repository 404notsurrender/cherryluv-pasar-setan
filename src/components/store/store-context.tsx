import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Product, Variant } from "@/lib/store-data";

export type CartItem = { product: Product; variant: Variant | null; quantity: number; amount?: number; estimate?: number };
export const itemTotal = (i: CartItem) => i.estimate ?? (i.variant?.price ?? i.product.base_price) * i.quantity;
type StoreContextValue = {
  cart: CartItem[]; cartCount: number; user: User | null; authReady: boolean;
  addItem: (product: Product, variant: Variant | null, quantity: number, dynamic?: { amount: number; estimate: number }) => void;
  updateQuantity: (index: number, quantity: number) => void; removeItem: (index: number) => void;
  clearCart: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    const raw = localStorage.getItem("clm-cart");
    if (raw) { try { setCart(JSON.parse(raw) as CartItem[]); } catch { localStorage.removeItem("clm-cart"); } }
    supabase.auth.getUser().then(({ data }) => { setUser(data.user); setAuthReady(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED", "INITIAL_SESSION"].includes(event)) setUser(session?.user ?? null);
      setAuthReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("clm-cart", JSON.stringify(cart)); }, [cart]);
  const value = useMemo<StoreContextValue>(() => ({
    cart, user, authReady, cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    addItem: (product, variant, quantity, dynamic) => setCart((current) => {
      if (dynamic) return [...current, { product, variant: null, quantity: 1, ...dynamic }];
      const i = current.findIndex((item) => item.product.id === product.id && item.variant?.id === variant?.id);
      if (i < 0) return [...current, { product, variant, quantity }];
      return current.map((item, index) => index === i ? { ...item, quantity: Math.min(99, item.quantity + quantity) } : item);
    }),
    updateQuantity: (index, quantity) => setCart((current) => current.map((item, i) => i === index && item.amount === undefined ? { ...item, quantity: Math.max(1, Math.min(99, quantity)) } : item)),
    removeItem: (index) => setCart((current) => current.filter((_, i) => i !== index)),
    clearCart: () => setCart([]),
  }), [cart, user, authReady]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside StoreProvider");
  return context;
}