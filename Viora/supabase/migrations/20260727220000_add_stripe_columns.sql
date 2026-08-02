-- Reintroduz as colunas do Stripe (dropadas em 20260715170000 quando o
-- projeto migrou pra EFI). Os campos efi_* ficam intactos, pra preservar o
-- histórico de pagamentos já feitos por lá.
alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.subscriptions add column if not exists stripe_subscription_id text;
alter table public.subscriptions add column if not exists stripe_customer_id text;
alter table public.payments add column if not exists stripe_invoice_id text unique;
