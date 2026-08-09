import * as wmill from "windmill-client";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from "/u/admin/lib_whatsapp";

/**
 * Windmill Script 9: Ask User Name
 * 
 * Roda quando o estado é ASK_NAME.
 * Envia a mensagem de boas-vindas pedindo o nome e muda o status para AWAITING_NAME.
 */
export async function main(
  sender_number: string,
  remote_jid: string
) {
  const SUPABASE_URL = await wmill.getVariable("u/admin/SUPABASE_URL");
  const SUPABASE_KEY = await wmill.getVariable("u/admin/SUPABASE_SERVICE_ROLE_KEY");
  const EVOLUTION_API_URL = await wmill.getVariable("u/admin/EVOLUTION_API_URL");
  const EVOLUTION_API_KEY = await wmill.getVariable("u/admin/EVOLUTION_API_KEY");
  const EVOLUTION_INSTANCE = await wmill.getVariable("u/admin/EVOLUTION_INSTANCE");

  if (!SUPABASE_URL || !SUPABASE_KEY || !EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
    throw new Error("Missing variables");
  }

  const supabase = createClient(SUPABASE_URL as string, SUPABASE_KEY as string);

  // 1. Atualizar state para IDLE (reset)
  await supabase
      .from("whatsapp_sessions")
      .update({ state: "IDLE" })
      .eq("phone_number", sender_number);

  // 2. Avisar que precisa criar a conta no site
  const text =
    "👋  *OI! AINDA NÃO TE CONHEÇO*\n\n" +
    "▬▬▬▬▬▬▬▬▬▬▬▬\n\n" +
    "Pra eu começar a analisar seus pratos e seu corpo com IA, você precisa assinar o plano *Renascer Completo* (já inclui o Viora).\n\n" +
    "👉 https://www.jeanspagolla.com.br/checkout?plan=completo\n\n" +
    "▬▬▬▬▬▬▬▬▬▬▬▬\n\n" +
    "_Depois de assinar, é só voltar aqui e mandar um_ *oi* _de novo._";

  await sendWhatsAppMessage(EVOLUTION_API_URL as string, EVOLUTION_API_KEY as string, EVOLUTION_INSTANCE as string, remote_jid, text);

  return { success: true, new_state: "IDLE" };
}
