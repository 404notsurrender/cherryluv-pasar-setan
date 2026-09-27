<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to Lovable. Avoid rewriting published git history.
<!-- LOVABLE:END -->

- Store customer and admin identity in Lovable Cloud Auth; keep roles only in `public.user_roles` because client-side role claims are unsafe.
- Calculate order totals and decrement stock only through the `create_order` database function because frontend prices are untrusted.
- Public catalog reads use anonymous RLS while checkout, customer history, and admin actions use authenticated server functions.
