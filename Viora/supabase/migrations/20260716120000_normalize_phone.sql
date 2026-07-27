-- Telefone canônico em profiles.phone.
--
-- BR:            '55' + DDD (2 dígitos) + celular com 9º dígito = 13 dígitos.
-- Internacional: só os dígitos, como veio (DDI 44, 1, etc.).
--
-- Motivo: o bot do WhatsApp identifica o usuário pelo telefone e o wa_id da
-- Meta chega SEM o 9º dígito pra números BR antigos. A unique constraint em
-- profiles.phone compara texto exato, então 5541984317383 (site) e
-- 554184317383 (WhatsApp) passavam como números diferentes → 2 contas da
-- mesma pessoa. O trigger abaixo normaliza em QUALQUER escrita (checkout,
-- trigger handle_new_user, RPC register_user_profile, updates do Windmill).
-- Espelhada em TS: src/lib/phone.ts (site) e lib_whatsapp.ts (Windmill).

CREATE OR REPLACE FUNCTION public.normalize_phone_br(raw text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  d text;
  ddd text;
  rest text;
BEGIN
  d := regexp_replace(coalesce(raw, ''), '\D', '', 'g');

  IF d LIKE '55%' AND length(d) IN (12, 13) THEN
    -- Já veio com DDI 55: 12 dígitos = falta o 9º, 13 = completo
    ddd := substr(d, 3, 2);
    rest := substr(d, 5);
  ELSIF length(d) = 11 AND substr(d, 3, 1) = '9' THEN
    -- DDD + celular sem DDI (ex.: 41991945937)
    RETURN '55' || d;
  ELSIF length(d) = 10 THEN
    -- DDD + número antigo sem DDI
    ddd := substr(d, 1, 2);
    rest := substr(d, 3);
  ELSE
    -- Internacional ou formato desconhecido: não arriscar palpite
    RETURN d;
  END IF;

  -- Celular BR antigo tem 8 dígitos começando em 6-9; prefixa o 9º dígito.
  -- Fixo (2-5) fica como está.
  IF length(rest) = 8 AND substr(rest, 1, 1) BETWEEN '6' AND '9' THEN
    rest := '9' || rest;
  END IF;

  RETURN '55' || ddd || rest;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_profile_phone()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.phone IS NOT NULL THEN
    NEW.phone := public.normalize_phone_br(NEW.phone);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_profile_phone ON public.profiles;
CREATE TRIGGER trg_normalize_profile_phone
  BEFORE INSERT OR UPDATE OF phone ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.normalize_profile_phone();
