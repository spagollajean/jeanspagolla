import * as wmill from "windmill-client";
import { createClient } from "@supabase/supabase-js";
import { normalizePhoneBR, sendWhatsAppMessage as sendWA } from "/u/admin/lib_whatsapp";

/**
 * Windmill Script 8: Register Ghost User (WhatsApp First)
 *
 * Este script roda quando o state = "AWAITING_NAME".
 * Ele pega o texto digitado (nome) e cria uma conta fantasma.
 */
export async function main(
  sender_number: string,
  remote_jid: string,
  user_name: string
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

  async function sendWhatsAppMessage(text: string) {
      await sendWA(EVOLUTION_API_URL as string, EVOLUTION_API_KEY as string, EVOLUTION_INSTANCE as string, remote_jid, text);
  }

  // Nome capturado da mensagem do usuário
  const fullName = (user_name || "").trim() || "Usuário";
  // wa_id da Meta pode vir sem o 9º dígito — salvar sempre o formato canônico
  // pra não duplicar conta de quem depois se cadastra pelo site com o 9.
  const canonicalPhone = normalizePhoneBR(sender_number);
  const fakeEmail = `${canonicalPhone}@whatsapp.app.jeanspagolla.com.br`;
  const randomPassword = Math.random().toString(36).slice(-10) + "Viora2026!";

  // 1. Criar Auth User via Admin API (Ignora confirmação de email)
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: fakeEmail,
      password: randomPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName }
  });

  if (authErr) {
      console.error("Erro ao criar Auth User:", authErr);
      await sendWhatsAppMessage("Desculpe, tivemos um problema ao criar sua conta. Tente novamente mais tarde.");
      return { success: false, error: authErr };
  }

  const userId = authData.user.id;

  // 2. Atualizar o Profile com o Telefone
  // O trigger do Supabase já deve ter criado o profile vazio. Vamos dar update.
  await supabase.from("profiles").update({
      full_name: fullName,
      phone: canonicalPhone,
      coach_personality: 'gordon_ramsay' // Padrão
  }).eq("id", userId);

  // 3. Atualizar o status da conversa para IDLE
  await supabase.from("whatsapp_sessions").update({
      state: "IDLE"
  }).eq("phone_number", sender_number);

  // 4. Enviar mensagem de Boas Vindas
  const welcomeText =
    `🎉  *PRONTINHO, ${fullName.toUpperCase()}!*\n\n` +
    "▬▬▬▬▬▬▬▬▬▬▬▬\n\n" +
    "Sua conta foi criada.\n\n" +
    "Pra continuar usando seu personal e nutri de bolso, você precisa assinar o plano *Renascer Completo* (já inclui o Viora).\n\n" +
    "👉 https://www.jeanspagolla.com.br/checkout?plan=completo";

  await sendWhatsAppMessage(welcomeText);

  return { success: true, user_id: userId };
}
