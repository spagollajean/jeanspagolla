//nobundling
import { createClient } from "@supabase/supabase-js";
import * as wmill from "windmill-client";
import { generatePhoneCandidates } from "/u/admin/lib_whatsapp";

/**
 * Windmill Script 2: Fetch User and State
 * 
 * Verifica no Supabase quem enviou a mensagem e em qual "fase" a IA está.
 * Implementa o Bloqueio (Paywall) do Trial.
 */
export async function main(sender_number: string, message_id: string) {
  const SUPABASE_URL = await wmill.getVariable("u/admin/SUPABASE_URL");
  const SUPABASE_KEY = await wmill.getVariable("u/admin/SUPABASE_SERVICE_ROLE_KEY");
  
  if(!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing Supabase credentials in Windmill Variables");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const phoneCandidates = generatePhoneCandidates(sender_number);

  let user: any = null;
  for (const candidate of phoneCandidates) {
      const { data } = await supabase
          .from("profiles")
          .select("id, phone, coach_personality")
          .eq("phone", candidate)
          .maybeSingle();

      if (data) {
          user = data;
          break;
      }
  }

  let { data: conv } = await supabase
      .from("whatsapp_sessions")
      .select("*")
      .eq("phone_number", sender_number)
      .maybeSingle();

  // UPSERT DO CONTEXTO
  if (!conv) {
      const initialState = user ? "IDLE" : "ASK_NAME";
      const { data: newConv } = await supabase
          .from("whatsapp_sessions")
          .insert({
              phone_number: sender_number,
              state: initialState
          })
          .select()
          .single();
      conv = newConv;
  } else if (!user) {
      if (conv.state !== "AWAITING_NAME") {
          conv.state = "ASK_NAME";
      }
      await supabase
          .from("whatsapp_sessions")
          .update({ state: conv.state, updated_at: new Date().toISOString() })
          .eq("phone_number", sender_number);
  } else {
      await supabase
          .from("whatsapp_sessions")
          .update({ updated_at: new Date().toISOString() })
          .eq("phone_number", sender_number);
  }

  if (!user) {
      return { 
          has_account: false, 
          state: conv.state, 
          user_id: null,
          is_duplicate: false
      };
  }

  // Paywall Logic - Verifica se a assinatura esta ativa E dentro do periodo pago (valid_until).
  // Usa get_active_entitlement em vez de checar status direto, pra funcionar tambem com
  // pagamentos avulsos (PIX) que nao tem renovacao automatica via webhook.
  let isLimitReached = true; // Por padrão, bloqueado

  const { data: entitlement, error: entError } = await supabase.rpc('get_active_entitlement', { p_user_id: user.id });
  if (entError) {
      console.error("Erro ao checar entitlement:", entError);
  }
  if (entitlement && entitlement.length > 0) {
      isLimitReached = false;
  }

  const finalState = isLimitReached ? "LIMIT_REACHED" : (conv?.state || "IDLE");

  return {
      has_account: true,
      is_duplicate: false,
      user_id: user.id,
      state: finalState,
      conversation_id: sender_number,
      coach_personality: user.coach_personality || "gordon_ramsay",
      limit_reached: isLimitReached
  };
}
