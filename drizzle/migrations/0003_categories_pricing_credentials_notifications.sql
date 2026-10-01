ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'refunded';

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE RESTRICT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS categories_parent_idx ON public.categories(parent_id);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pricing_type text NOT NULL DEFAULT 'fixed';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD CONSTRAINT products_pricing_type_chk CHECK (pricing_type IN ('fixed','koin','robux_gift','robux_login'));

CREATE TABLE public.pricing_rules (
  key text PRIMARY KEY,
  name text NOT NULL,
  rate integer NOT NULL CHECK (rate > 0),
  unit integer NOT NULL DEFAULT 1 CHECK (unit > 0),
  minimum_amount bigint NOT NULL DEFAULT 1 CHECK (minimum_amount > 0),
  increment bigint NOT NULL DEFAULT 1 CHECK (increment > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pricing_rules TO anon, authenticated;
GRANT UPDATE ON public.pricing_rules TO authenticated;
GRANT ALL ON public.pricing_rules TO service_role;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY pricing_public_read ON public.pricing_rules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY pricing_admin_update ON public.pricing_rules FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.pricing_rules (key,name,rate,unit,minimum_amount,increment) VALUES
 ('koin','Koin Pasar Setan',20000,1000000,1000000,100000),
 ('robux_gift','Gift In-game',180,1,1,1)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS category_name text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS item_amount bigint;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS pricing_rate integer;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS pricing_unit integer;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS pricing_meta jsonb;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'IDR';

CREATE TABLE public.order_credentials (
  order_id uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  roblox_username text NOT NULL,
  roblox_password text,
  backup_code text,
  status text NOT NULL DEFAULT 'provided' CHECK (status IN ('provided','in_use','fulfillment_completed','cleared')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.order_credentials TO authenticated;
GRANT ALL ON public.order_credentials TO service_role;
ALTER TABLE public.order_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY credentials_admin_read ON public.order_credentials FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY credentials_admin_update ON public.order_credentials FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('telegram','discord')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  message text NOT NULL,
  error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, channel)
);
GRANT SELECT ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_admin_read ON public.notifications FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

DROP FUNCTION IF EXISTS public.create_order(text,text,text,text,text,text,jsonb,text);
CREATE FUNCTION public.create_order(p_roblox_username text, p_roblox_display_name text, p_whatsapp text, p_discord_username text, p_notes text, p_payment_method text, p_items jsonb, p_idempotency_key text, p_credentials jsonb DEFAULT NULL)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid(); v_customer uuid; v_order uuid; v_order_number text; v_total integer := 0;
  v_item jsonb; v_product record; v_variant record; v_rule record; v_qty integer; v_amount bigint; v_price integer;
  v_has_login boolean := false; v_rate integer; v_unit integer; v_cat text; v_vname text; v_vid uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF length(trim(p_roblox_username)) < 3 OR length(p_roblox_username) > 20 THEN RAISE EXCEPTION 'Invalid Roblox username'; END IF;
  IF length(trim(p_roblox_display_name)) < 1 OR length(p_roblox_display_name) > 50 THEN RAISE EXCEPTION 'Invalid display name'; END IF;
  IF p_whatsapp !~ '^\+?[0-9]{9,15}$' THEN RAISE EXCEPTION 'Invalid WhatsApp number'; END IF;
  IF p_payment_method <> 'QRIS' THEN RAISE EXCEPTION 'Invalid payment method'; END IF;
  IF jsonb_array_length(p_items) < 1 OR jsonb_array_length(p_items) > 30 THEN RAISE EXCEPTION 'Invalid cart'; END IF;
  SELECT order_number INTO v_order_number FROM public.orders WHERE user_id = v_user AND idempotency_key = p_idempotency_key;
  IF v_order_number IS NOT NULL THEN RETURN v_order_number; END IF;

  INSERT INTO public.customers (user_id, roblox_username, roblox_display_name, whatsapp, discord_username)
  VALUES (v_user, trim(p_roblox_username), trim(p_roblox_display_name), p_whatsapp, nullif(trim(p_discord_username), ''))
  ON CONFLICT (user_id) DO UPDATE SET roblox_username = EXCLUDED.roblox_username, roblox_display_name = EXCLUDED.roblox_display_name, whatsapp = EXCLUDED.whatsapp, discord_username = EXCLUDED.discord_username, updated_at = now()
  RETURNING id INTO v_customer;

  v_order_number := 'CLM-' || to_char(now() AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 4, '0');
  INSERT INTO public.orders (order_number, user_id, customer_id, payment_method, notes, total_amount, idempotency_key, payment_gateway)
  VALUES (v_order_number, v_user, v_customer, p_payment_method, nullif(trim(p_notes), ''), 0, p_idempotency_key, 'pakasir')
  RETURNING id INTO v_order;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := coalesce((v_item->>'quantity')::integer, 1);
    IF v_qty < 1 OR v_qty > 99 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
    SELECT p.id, p.name, p.base_price, p.stock, p.pricing_type, c.name AS cat INTO v_product
      FROM public.products p JOIN public.categories c ON c.id = p.category_id
      WHERE p.id = (v_item->>'product_id')::uuid AND p.status = 'active' FOR UPDATE OF p;
    IF NOT FOUND THEN RAISE EXCEPTION 'Product unavailable'; END IF;
    v_amount := NULL; v_rate := NULL; v_unit := NULL; v_vid := NULL; v_vname := NULL;

    IF v_product.pricing_type = 'koin' OR v_product.pricing_type = 'robux_gift' THEN
      SELECT * INTO v_rule FROM public.pricing_rules WHERE key = v_product.pricing_type;
      v_amount := (v_item->>'amount')::bigint;
      IF v_amount IS NULL OR v_amount < v_rule.minimum_amount OR v_amount % v_rule.increment <> 0 OR v_amount > 1000000000 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
      v_qty := 1; v_rate := v_rule.rate; v_unit := v_rule.unit;
      v_price := ceil(v_amount::numeric * v_rule.rate / v_rule.unit)::integer;
      v_vname := to_char(v_amount, 'FM999G999G999G999') || CASE WHEN v_product.pricing_type = 'koin' THEN ' Koin' ELSE ' Robux' END;
    ELSIF v_item->>'variant_id' IS NOT NULL AND v_item->>'variant_id' <> '' THEN
      SELECT pv.id, pv.name, pv.price, pv.stock, pv.quantity_value INTO v_variant FROM public.product_variants pv
        WHERE pv.id = (v_item->>'variant_id')::uuid AND pv.product_id = v_product.id AND pv.active FOR UPDATE;
      IF NOT FOUND OR v_variant.stock < v_qty THEN RAISE EXCEPTION 'Insufficient variant stock'; END IF;
      v_price := v_variant.price; v_vid := v_variant.id; v_vname := v_variant.name;
      IF v_product.pricing_type = 'robux_login' THEN
        IF v_has_login THEN RAISE EXCEPTION 'Only one Robux Via Login package per order'; END IF;
        v_has_login := true; v_qty := 1; v_amount := v_variant.quantity_value;
      END IF;
      UPDATE public.product_variants SET stock = stock - v_qty WHERE id = v_variant.id;
    ELSE
      IF v_product.pricing_type <> 'fixed' THEN RAISE EXCEPTION 'Package required'; END IF;
      IF v_product.stock < v_qty THEN RAISE EXCEPTION 'Insufficient product stock'; END IF;
      v_price := v_product.base_price;
      UPDATE public.products SET stock = stock - v_qty WHERE id = v_product.id;
    END IF;

    v_total := v_total + v_price * v_qty;
    INSERT INTO public.order_items (order_id, product_id, variant_id, product_name, variant_name, unit_price, quantity, subtotal, category_name, item_amount, pricing_rate, pricing_unit, pricing_meta)
    VALUES (v_order, v_product.id, v_vid, v_product.name, v_vname, v_price, v_qty, v_price * v_qty, v_product.cat, v_amount, v_rate, v_unit, jsonb_build_object('pricing_type', v_product.pricing_type));
  END LOOP;

  IF v_has_login THEN
    IF p_credentials IS NULL OR length(coalesce(p_credentials->>'username','')) < 3 OR length(coalesce(p_credentials->>'password','')) < 1
       OR length(p_credentials->>'password') > 200 OR length(coalesce(p_credentials->>'backup_code','')) > 200 THEN
      RAISE EXCEPTION 'Login data required';
    END IF;
    INSERT INTO public.order_credentials (order_id, roblox_username, roblox_password, backup_code)
    VALUES (v_order, trim(p_credentials->>'username'), p_credentials->>'password', nullif(trim(coalesce(p_credentials->>'backup_code','')), ''));
  END IF;

  IF v_total < 1 THEN RAISE EXCEPTION 'Invalid total'; END IF;
  UPDATE public.orders SET total_amount = v_total WHERE id = v_order;
  INSERT INTO public.payments (order_id, method, amount, gateway) VALUES (v_order, p_payment_method, v_total, 'pakasir');
  RETURN v_order_number;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.create_order(text,text,text,text,text,text,jsonb,text,jsonb) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.create_order(text,text,text,text,text,text,jsonb,text,jsonb) TO authenticated;

DROP FUNCTION IF EXISTS public.track_order(text,text);
CREATE FUNCTION public.track_order(p_order_number text, p_identity text)
 RETURNS TABLE(order_number text, status order_status, payment_status payment_status, total_amount integer, roblox_username text, payment_method text, created_at timestamptz, updated_at timestamptz, items text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT o.order_number, o.status, o.payment_status, o.total_amount, c.roblox_username, o.payment_method, o.created_at, o.updated_at,
    (SELECT string_agg(oi.product_name || coalesce(' — ' || oi.variant_name, '') || ' × ' || oi.quantity, ', ') FROM public.order_items oi WHERE oi.order_id = o.id)
  FROM public.orders o JOIN public.customers c ON c.id = o.customer_id
  WHERE upper(o.order_number) = upper(trim(p_order_number))
    AND (lower(c.roblox_username) = lower(trim(p_identity)) OR regexp_replace(c.whatsapp, '[^0-9]', '', 'g') = regexp_replace(p_identity, '[^0-9]', '', 'g'))
  LIMIT 1
$function$;
GRANT EXECUTE ON FUNCTION public.track_order(text,text) TO anon, authenticated;