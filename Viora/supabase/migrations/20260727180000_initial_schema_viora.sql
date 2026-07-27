-- Estrutura inicial do Viora, migrada do schema public do FoodSnap (projeto mnhgpnqkwuqzpvfrwftp).
--
-- Deixadas de fora de propósito (confirmado: não usadas em nenhum script ativo do
-- Windmill nem no app): check_analysis_access, check_access_by_whatsapp -- essa
-- ultima referencia user_identities/profiles.public_id, que nao existem em lugar
-- nenhum (nem migration nem uso real).
--
-- get_active_entitlement FOI incluida (ao contrario do que uma versao anterior
-- deste arquivo dizia) -- e chamada via RPC por 4 dos scripts do Windmill
-- (Fetch_User_State, Process_Food_AI, Process_Body_AI, Daily_Summary, Send_Reminders).
-- Ela depende da view user_entitlements, criada em 20260604_enrich_database.sql
-- do FoodSnap original como camada de retrocompatibilidade sobre a tabela
-- subscriptions (user_entitlements chegou a ser uma TABELA de verdade, foi
-- dropada no master_reset.sql e virou VIEW depois).

create extension if not exists pgcrypto;

-- ============ TABELAS ============

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  phone text,
  full_name text,
  email text,
  is_admin boolean DEFAULT false,
  coach_personality text DEFAULT 'gordon_ramsay'::text,
  cpf text,
  birth_date date,
  address_zip text,
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_city text,
  address_state text,
  efi_payment_token text,
  goal text
);

CREATE TABLE public.subscriptions (
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  plan text DEFAULT 'free'::text,
  status text DEFAULT 'inactive'::text,
  valid_until timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  efi_subscription_id text
);

CREATE TABLE public.whatsapp_sessions (
  phone_number text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  state text DEFAULT 'IDLE'::text,
  temp_data jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE public.food_analyses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  food_name text,
  calories integer,
  protein integer,
  carbs integer,
  fat integer,
  score integer,
  ai_raw_response text,
  image_url text,
  total_calories numeric,
  total_protein numeric,
  total_carbs numeric,
  total_fat numeric,
  total_fiber numeric,
  total_sodium_mg numeric,
  nutrition_score integer,
  confidence_level text,
  used_free_quota boolean DEFAULT false,
  source text DEFAULT 'web'::text,
  source_message_id text,
  ai_structured jsonb
);

CREATE TABLE public.coach_assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  biotype text,
  estimated_body_fat integer,
  muscle_mass_level text,
  goal_suggestion text,
  workout_plan text,
  diet_plan text,
  ai_raw_response text,
  image_url text,
  source text DEFAULT 'web'::text,
  ai_structured jsonb,
  used_free_quota boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'completed'::text,
  plan_type text NOT NULL DEFAULT 'monthly'::text,
  payment_method text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  efi_charge_id text
);

-- ============ CONSTRAINTS ============
-- profiles primeiro: subscriptions/food_analyses/coach_assessments/payments
-- tem FK pra profiles(id), que precisa da PK dela ja existindo.

ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_goal_check CHECK ((goal = ANY (ARRAY['emagrecer'::text, 'ganhar_massa'::text, 'manter'::text])));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_key UNIQUE (phone);

ALTER TABLE public.whatsapp_sessions ADD CONSTRAINT whatsapp_sessions_pkey PRIMARY KEY (phone_number);

ALTER TABLE public.food_analyses ADD CONSTRAINT food_analyses_pkey PRIMARY KEY (id);
ALTER TABLE public.food_analyses ADD CONSTRAINT food_analyses_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE public.coach_assessments ADD CONSTRAINT coach_assessments_pkey PRIMARY KEY (id);
ALTER TABLE public.coach_assessments ADD CONSTRAINT coach_assessments_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE public.payments ADD CONSTRAINT payments_efi_charge_id_key UNIQUE (efi_charge_id);
ALTER TABLE public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);
ALTER TABLE public.payments ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (user_id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ============ INDICES ============

CREATE INDEX idx_food_analyses_user_id ON public.food_analyses USING btree (user_id);
CREATE INDEX idx_coach_assessments_user_id ON public.coach_assessments USING btree (user_id);
CREATE INDEX idx_payments_user_id ON public.payments USING btree (user_id);

-- ============ RLS ============

ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO public USING (((SELECT auth.uid() AS uid) = id));
CREATE POLICY "Users can update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO public USING (((SELECT auth.uid() AS uid) = id));
CREATE POLICY "Users can view own subscription" ON public.subscriptions AS PERMISSIVE FOR SELECT TO public USING (((SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Users can view own payments" ON public.payments AS PERMISSIVE FOR SELECT TO public USING (((SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Users can view their own assessments" ON public.coach_assessments AS PERMISSIVE FOR SELECT TO public USING (((SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Users can view their own food analyses" ON public.food_analyses AS PERMISSIVE FOR SELECT TO public USING (((SELECT auth.uid() AS uid) = user_id));

-- ============ FUNCOES ============
-- (get_active_entitlement, check_analysis_access, check_access_by_whatsapp deixadas de fora --
--  ver nota no topo do arquivo)

CREATE OR REPLACE FUNCTION public.register_user_profile(p_full_name text, p_phone text, p_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    UPDATE public.profiles
    SET full_name = p_full_name,
        phone = p_phone,
        email = p_email
    WHERE id = auth.uid();
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, phone, email, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'phone', new.email, new.raw_user_meta_data->>'full_name');
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (new.id, 'free', 'inactive');

  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.only_digits(t text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select regexp_replace(coalesce(t,''), '\D', '', 'g');
$function$;

-- prefixo trocado de 'FS-' (FoodSnap) para 'VI-' (Viora).
-- gen_random_bytes vive no schema "extensions" neste self-hosted (nao em "public"),
-- por isso precisa dele no search_path.
CREATE OR REPLACE FUNCTION public.make_public_id(prefix text DEFAULT 'VI-'::text)
 RETURNS text
 LANGUAGE sql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
  select prefix || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.normalize_phone_br(raw text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
  d text;
  ddd text;
  rest text;
BEGIN
  d := regexp_replace(coalesce(raw, ''), '\D', '', 'g');

  IF d LIKE '55%' AND length(d) IN (12, 13) THEN
    ddd := substr(d, 3, 2);
    rest := substr(d, 5);
  ELSIF length(d) = 11 AND substr(d, 3, 1) = '9' THEN
    RETURN '55' || d;
  ELSIF length(d) = 10 THEN
    ddd := substr(d, 1, 2);
    rest := substr(d, 3);
  ELSE
    RETURN d;
  END IF;

  IF length(rest) = 8 AND substr(rest, 1, 1) BETWEEN '6' AND '9' THEN
    rest := '9' || rest;
  END IF;

  RETURN '55' || ddd || rest;
END;
$function$;

-- View de retrocompatibilidade: user_entitlements sobre subscriptions
CREATE OR REPLACE VIEW public.user_entitlements AS
SELECT
    user_id,
    plan AS entitlement_code,
    (status = 'trialing') AS is_trial,
    (status = 'active' OR status = 'trialing') AS is_active,
    valid_until,
    '{}'::jsonb AS usage,
    created_at,
    updated_at,
    plan AS plan_type
FROM public.subscriptions;

CREATE OR REPLACE FUNCTION public.get_active_entitlement(p_user_id uuid)
 RETURNS TABLE(entitlement_code text, is_active boolean, valid_until timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select ue.entitlement_code::text,
         ue.is_active,
         ue.valid_until
  from public.user_entitlements ue
  where ue.user_id = p_user_id
    and ue.is_active = true
    and (ue.valid_until is null or ue.valid_until > now())
  order by ue.valid_until desc nulls first
  limit 1;
$function$;

CREATE OR REPLACE FUNCTION public.normalize_profile_phone()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.phone IS NOT NULL THEN
    NEW.phone := public.normalize_phone_br(NEW.phone);
  END IF;
  RETURN NEW;
END;
$function$;

-- ============ TRIGGERS ============

CREATE TRIGGER trg_normalize_profile_phone BEFORE INSERT OR UPDATE OF phone ON public.profiles FOR EACH ROW EXECUTE FUNCTION normalize_profile_phone();
CREATE TRIGGER update_whatsapp_sessions_modtime BEFORE UPDATE ON public.whatsapp_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- trigger em auth.users -- cria profile + subscription automaticamente no cadastro
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
