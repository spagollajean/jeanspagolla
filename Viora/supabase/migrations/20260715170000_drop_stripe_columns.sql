-- Stripe desativado em definitivo (migração pra EFI concluída em 2026-07-15).
-- Os únicos registros com esses campos eram testes internos pré-migração.
alter table public.payments drop column if exists stripe_invoice_id;
alter table public.profiles drop column if exists stripe_customer_id;
alter table public.subscriptions drop column if exists stripe_subscription_id;
alter table public.subscriptions drop column if exists stripe_customer_id;
