ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_gateway text NOT NULL DEFAULT 'pakasir',
  ADD COLUMN IF NOT EXISTS payment_transaction_id text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS gateway text NOT NULL DEFAULT 'pakasir',
  ADD COLUMN IF NOT EXISTS transaction_id text,
  ADD COLUMN IF NOT EXISTS qr_string text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS raw_reference jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS payments_order_id_key ON public.payments(order_id);

CREATE OR REPLACE FUNCTION public.mark_order_paid(p_order_number text, p_amount integer, p_reference jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_order record;
BEGIN
  SELECT id, total_amount, payment_status INTO v_order FROM public.orders WHERE order_number = p_order_number FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF v_order.total_amount <> p_amount THEN RAISE EXCEPTION 'Amount mismatch'; END IF;
  IF v_order.payment_status = 'paid' THEN RETURN false; END IF;
  UPDATE public.orders SET payment_status = 'paid', status = 'paid', paid_at = now(), updated_at = now() WHERE id = v_order.id;
  UPDATE public.payments SET status = 'paid', paid_at = now(), raw_reference = p_reference, updated_at = now() WHERE order_id = v_order.id;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.mark_order_paid(text, integer, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_order_paid(text, integer, jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.expire_order(p_order_number text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_id uuid;
BEGIN
  UPDATE public.orders SET payment_status = 'expired', status = 'expired', updated_at = now()
  WHERE order_number = p_order_number AND payment_status = 'pending' AND expires_at IS NOT NULL AND expires_at < now()
  RETURNING id INTO v_id;
  IF v_id IS NOT NULL THEN UPDATE public.payments SET status = 'expired', updated_at = now() WHERE order_id = v_id; END IF;
END $$;
REVOKE ALL ON FUNCTION public.expire_order(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_order(text) TO service_role;

CREATE OR REPLACE FUNCTION public.create_order(p_roblox_username text, p_roblox_display_name text, p_whatsapp text, p_discord_username text, p_notes text, p_payment_method text, p_items jsonb, p_idempotency_key text)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid(); v_customer uuid; v_order uuid; v_order_number text; v_total integer := 0;
  v_item jsonb; v_product record; v_variant record; v_qty integer; v_price integer;
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
  INSERT INTO public.orders (order_number, user_id, customer_id, payment_method, notes, total_amount, idempotency_key, payment_gateway)
  VALUES (v_order_number, v_user, v_customer, p_payment_method, nullif(trim(p_notes), ''), v_total, p_idempotency_key, 'pakasir')
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
  INSERT INTO public.payments (order_id, method, amount, gateway) VALUES (v_order, p_payment_method, v_total, 'pakasir');
  RETURN v_order_number;
END;
$function$;