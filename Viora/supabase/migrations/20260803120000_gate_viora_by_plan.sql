-- O Renascer agora tem 2 planos: Essencial (sem Viora) e Completo (com
-- Viora). subscriptions.plan guarda 'essencial'/'completo'. Antes, qualquer
-- assinatura ativa liberava o Viora (bot no WhatsApp + dashboard) -- agora
-- só o plano Completo libera. Usado por 5 scripts do Windmill via RPC
-- (Fetch_User_State, Process_Food_AI, Process_Body_AI, Daily_Summary,
-- Send_Reminders) e pelo dashboard web (UserContext.tsx).
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
    and ue.entitlement_code = 'completo'
    and (ue.valid_until is null or ue.valid_until > now())
  order by ue.valid_until desc nulls first
  limit 1;
$function$;
