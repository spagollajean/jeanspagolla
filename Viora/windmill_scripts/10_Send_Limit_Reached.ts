import * as wmill from "windmill-client";
import { sendWhatsAppMessage } from "/u/admin/lib_whatsapp";

/**
 * Windmill Script 10: Send Limit Reached Message
 *
 * Roda quando o estado é LIMIT_REACHED.
 * Envia uma mensagem informando que a cota gratuita acabou e oferece o plano PRO.
 */
export async function main(
  remote_jid: string
) {
  const EVOLUTION_API_URL = await wmill.getVariable("u/admin/EVOLUTION_API_URL");
  const EVOLUTION_API_KEY = await wmill.getVariable("u/admin/EVOLUTION_API_KEY");
  const EVOLUTION_INSTANCE = await wmill.getVariable("u/admin/EVOLUTION_INSTANCE");

  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
    throw new Error("Missing Evolution API variables");
  }

  const text =
    "🚨  *ASSINATURA INATIVA*\n\n" +
    "▬▬▬▬▬▬▬▬▬▬▬▬\n\n" +
    "Pra eu analisar seus pratos e seu corpo, você precisa estar no plano *Renascer Completo* (já inclui o Viora).\n\n" +
    "👉 https://www.jeanspagolla.com.br/checkout?plan=completo";

  const res = await sendWhatsAppMessage(EVOLUTION_API_URL as string, EVOLUTION_API_KEY as string, EVOLUTION_INSTANCE as string, remote_jid, text);

  return { success: res.ok };
}
