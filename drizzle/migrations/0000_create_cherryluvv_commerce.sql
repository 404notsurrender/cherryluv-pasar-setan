CREATE TYPE public.app_role AS ENUM ('admin', 'customer');
CREATE TYPE public.product_status AS ENUM ('active', 'draft', 'archived');
CREATE TYPE public.order_status AS ENUM ('pending_payment', 'payment_confirmed', 'processing', 'completed', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text,
  avatar_url text,
  roblox_username text,
  roblox_display_name text,
  whatsapp text,
  discord_username text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
CREATE POLICY "roles_read_own_or_admin" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  icon text NOT NULL DEFAULT 'Sparkles',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "categories_admin_write" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  image_key text NOT NULL,
  base_price integer NOT NULL CHECK (base_price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  status public.product_status NOT NULL DEFAULT 'active',
  popularity integer NOT NULL DEFAULT 0,
  delivery_minutes integer NOT NULL DEFAULT 15,
  instructions text NOT NULL DEFAULT 'Pastikan username Roblox sudah benar dan akun dapat menerima item.',
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read_active" ON public.products FOR SELECT TO anon, authenticated USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "products_admin_write" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity_value integer NOT NULL DEFAULT 1 CHECK (quantity_value > 0),
  price integer NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "variants_public_read_active" ON public.product_variants FOR SELECT TO anon, authenticated USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "variants_admin_write" ON public.product_variants FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  roblox_username text NOT NULL,
  roblox_display_name text NOT NULL,
  whatsapp text NOT NULL,
  discord_username text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_read_own_or_admin" ON public.customers FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "customers_insert_own" ON public.customers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "customers_update_own_or_admin" ON public.customers FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE SEQUENCE public.order_number_seq START 1;
GRANT USAGE ON SEQUENCE public.order_number_seq TO authenticated, service_role;

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  status public.order_status NOT NULL DEFAULT 'pending_payment',
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  payment_method text NOT NULL,
  notes text,
  total_amount integer NOT NULL CHECK (total_amount >= 0),
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_read_own_or_admin" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "orders_admin_update" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  variant_id uuid REFERENCES public.product_variants(id),
  product_name text NOT NULL,
  variant_name text,
  unit_price integer NOT NULL CHECK (unit_price >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  subtotal integer NOT NULL CHECK (subtotal >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_read_own_or_admin" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  method text NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  amount integer NOT NULL CHECK (amount >= 0),
  provider_reference text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_read_own_or_admin" ON public.payments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE OR REPLACE FUNCTION public.create_order(
  p_roblox_username text,
  p_roblox_display_name text,
  p_whatsapp text,
  p_discord_username text,
  p_notes text,
  p_payment_method text,
  p_items jsonb,
  p_idempotency_key text
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_customer uuid;
  v_order uuid;
  v_order_number text;
  v_total integer := 0;
  v_item jsonb;
  v_product record;
  v_variant record;
  v_qty integer;
  v_price integer;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF length(trim(p_roblox_username)) < 3 OR length(p_roblox_username) > 20 THEN RAISE EXCEPTION 'Invalid Roblox username'; END IF;
  IF length(trim(p_roblox_display_name)) < 1 OR length(p_roblox_display_name) > 50 THEN RAISE EXCEPTION 'Invalid display name'; END IF;
  IF p_whatsapp !~ '^\+?[0-9]{9,15}$' THEN RAISE EXCEPTION 'Invalid WhatsApp number'; END IF;
  IF p_payment_method NOT IN ('QRIS', 'DANA', 'GoPay', 'Bank Transfer') THEN RAISE EXCEPTION 'Invalid payment method'; END IF;
  IF jsonb_array_length(p_items) < 1 OR jsonb_array_length(p_items) > 30 THEN RAISE EXCEPTION 'Invalid cart'; END IF;
  SELECT order_number INTO v_order_number FROM public.orders WHERE user_id = v_user AND idempotency_key = p_idempotency_key;
  IF v_order_number IS NOT NULL THEN RETURN v_order_number; END IF;

  INSERT INTO public.customers (user_id, roblox_username, roblox_display_name, whatsapp, discord_username)
  VALUES (v_user, trim(p_roblox_username), trim(p_roblox_display_name), p_whatsapp, nullif(trim(p_discord_username), ''))
  ON CONFLICT (user_id) DO UPDATE SET roblox_username = EXCLUDED.roblox_username, roblox_display_name = EXCLUDED.roblox_display_name, whatsapp = EXCLUDED.whatsapp, discord_username = EXCLUDED.discord_username, updated_at = now()
  RETURNING id INTO v_customer;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'quantity')::integer;
    IF v_qty < 1 OR v_qty > 99 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
    SELECT p.id, p.name, p.base_price, p.stock INTO v_product FROM public.products p WHERE p.id = (v_item->>'product_id')::uuid AND p.status = 'active' FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Product unavailable'; END IF;
    IF v_item->>'variant_id' IS NOT NULL AND v_item->>'variant_id' <> '' THEN
      SELECT pv.id, pv.name, pv.price, pv.stock INTO v_variant FROM public.product_variants pv WHERE pv.id = (v_item->>'variant_id')::uuid AND pv.product_id = v_product.id AND pv.active FOR UPDATE;
      IF NOT FOUND OR v_variant.stock < v_qty THEN RAISE EXCEPTION 'Insufficient variant stock'; END IF;
      v_price := v_variant.price;
    ELSE
      IF v_product.stock < v_qty THEN RAISE EXCEPTION 'Insufficient product stock'; END IF;
      v_price := v_product.base_price;
    END IF;
    v_total := v_total + (v_price * v_qty);
  END LOOP;

  v_order_number := 'CLM-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 4, '0');
  INSERT INTO public.orders (order_number, user_id, customer_id, payment_method, notes, total_amount, idempotency_key)
  VALUES (v_order_number, v_user, v_customer, p_payment_method, nullif(trim(p_notes), ''), v_total, p_idempotency_key)
  RETURNING id INTO v_order;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'quantity')::integer;
    SELECT p.id, p.name, p.base_price, p.stock INTO v_product FROM public.products p WHERE p.id = (v_item->>'product_id')::uuid FOR UPDATE;
    IF v_item->>'variant_id' IS NOT NULL AND v_item->>'variant_id' <> '' THEN
      SELECT pv.id, pv.name, pv.price, pv.stock INTO v_variant FROM public.product_variants pv WHERE pv.id = (v_item->>'variant_id')::uuid FOR UPDATE;
      v_price := v_variant.price;
      UPDATE public.product_variants SET stock = stock - v_qty WHERE id = v_variant.id;
      INSERT INTO public.order_items (order_id, product_id, variant_id, product_name, variant_name, unit_price, quantity, subtotal)
      VALUES (v_order, v_product.id, v_variant.id, v_product.name, v_variant.name, v_price, v_qty, v_price * v_qty);
    ELSE
      v_price := v_product.base_price;
      UPDATE public.products SET stock = stock - v_qty WHERE id = v_product.id;
      INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
      VALUES (v_order, v_product.id, v_product.name, v_price, v_qty, v_price * v_qty);
    END IF;
  END LOOP;
  INSERT INTO public.payments (order_id, method, amount) VALUES (v_order, p_payment_method, v_total);
  RETURN v_order_number;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_order(text,text,text,text,text,text,jsonb,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.track_order(p_order_number text, p_identity text)
RETURNS TABLE(order_number text, status public.order_status, payment_status public.payment_status, total_amount integer, roblox_username text, payment_method text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.order_number, o.status, o.payment_status, o.total_amount, c.roblox_username, o.payment_method, o.created_at
  FROM public.orders o JOIN public.customers c ON c.id = o.customer_id
  WHERE upper(o.order_number) = upper(trim(p_order_number))
    AND (lower(c.roblox_username) = lower(trim(p_identity)) OR regexp_replace(c.whatsapp, '[^0-9]', '', 'g') = regexp_replace(p_identity, '[^0-9]', '', 'g'))
  LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.track_order(text,text) TO anon, authenticated;

CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_orders_user ON public.orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status ON public.orders(status, created_at DESC);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);