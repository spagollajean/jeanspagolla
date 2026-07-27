-- Migração Stripe → EFI, passo 1 (aditivo, sem tocar nas colunas do Stripe).
-- O código em produção ainda usa as colunas Stripe; elas só serão removidas
-- numa migration separada, depois que as rotas EFI estiverem no ar.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS address_zip text,
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_number text,
  ADD COLUMN IF NOT EXISTS address_complement text,
  ADD COLUMN IF NOT EXISTS address_neighborhood text,
  ADD COLUMN IF NOT EXISTS address_city text,
  ADD COLUMN IF NOT EXISTS address_state text,
  ADD COLUMN IF NOT EXISTS efi_payment_token text;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS efi_subscription_id text;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS efi_charge_id text;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_efi_charge_id_key UNIQUE (efi_charge_id);
