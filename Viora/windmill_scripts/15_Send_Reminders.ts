//nobundling
import * as wmill from "windmill-client";
import { createClient } from "@supabase/supabase-js";
import { generatePhoneCandidates, sendWhatsAppMessage as sendWA } from "/u/admin/lib_whatsapp";

/**
 * Windmill Script 15: Send Reminders (água/refeição)
 *
 * Roda via schedule a cada 30 min (9h–21h de Brasília). REGRA DURA: só mensagem
 * de sessão dentro da janela grátis de 24h do WhatsApp — nunca template pago.
 * Por isso o corte é 23h desde a última mensagem RECEBIDA (margem de 1h).
 *
 * Anti-spam:
 * - máximo 3 lembretes/dia por usuário, cada slot só dispara 1x (controle no
 *   temp_data.reminders da whatsapp_sessions — sem tabela nova);
 * - pula quem interagiu nos últimos 45 min (tá no meio de uma conversa);
 * - pula quem não está IDLE (ex.: esperando foto do corpo);
 * - só assinante ativo (get_active_entitlement).
 *
 * Slots (hora de Brasília):
 * - agua_manha [10:00–11:00)  - almoco [12:00–13:00) se não registrou prato após 11h
 * - agua_tarde [16:00–17:00)  - jantar [19:30–20:30) se não registrou prato após 18h
 */

const BRT_OFFSET_MS = 3 * 60 * 60 * 1000;

function brtNow(): Date {
  return new Date(Date.now() - BRT_OFFSET_MS);
}

function dayKeyBRT(): string {
  return brtNow().toISOString().slice(0, 10);
}

// Início de hoje em BRT, expresso em UTC (pra filtrar food_analyses.created_at)
function startOfTodayBRT(): Date {
  const d = new Date(Date.now() - BRT_OFFSET_MS);
  d.setUTCHours(3, 0, 0, 0);
  return d;
}

function currentSlot(): string | null {
  const b = brtNow();
  const h = b.getUTCHours();
  const m = b.getUTCMinutes();
  if (h === 10) return "agua_manha";
  if (h === 12) return "almoco";
  if (h === 16) return "agua_tarde";
  if ((h === 19 && m >= 30) || (h === 20 && m < 30)) return "jantar";
  return null;
}

export async function main() {
  const EVOLUTION_API_URL = await wmill.getVariable("u/admin/EVOLUTION_API_URL") as string;
  const EVOLUTION_API_KEY = await wmill.getVariable("u/admin/EVOLUTION_API_KEY") as string;
  const EVOLUTION_INSTANCE = await wmill.getVariable("u/admin/EVOLUTION_INSTANCE") as string;
  const SUPABASE_URL = await wmill.getVariable("u/admin/SUPABASE_URL") as string;
  const SUPABASE_KEY = await wmill.getVariable("u/admin/SUPABASE_SERVICE_ROLE_KEY") as string;

  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE || !SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing required variables");
  }

  const slot = currentSlot();
  if (!slot) return { skipped: true, reason: "fora de slot" };

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const today = dayKeyBRT();

  // Janela grátis: última mensagem recebida < 23h. Ignora quem falou há < 45 min.
  const windowStart = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();
  const activeCutoff = new Date(Date.now() - 45 * 60 * 1000).toISOString();

  const { data: sessions, error: sesErr } = await supabase
    .from("whatsapp_sessions")
    .select("phone_number, state, updated_at, temp_data")
    .gte("updated_at", windowStart)
    .lte("updated_at", activeCutoff)
    .eq("state", "IDLE");
  if (sesErr) throw sesErr;

  let sent = 0;
  const results: any[] = [];

  for (const ses of sessions || []) {
    try {
      const tempData = (ses.temp_data || {}) as any;
      const sentToday: string[] = tempData?.reminders?.[today] || [];
      if (sentToday.includes(slot) || sentToday.length >= 3) continue;

      // Perfil + meta
      let profile: any = null;
      for (const cand of generatePhoneCandidates(ses.phone_number)) {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, goal")
          .eq("phone", cand)
          .maybeSingle();
        if (data) { profile = data; break; }
      }
      if (!profile) continue; // ghost sem conta — lembrete viraria paywall, pula

      // Só assinante ativo
      const { data: ent } = await supabase.rpc("get_active_entitlement", { p_user_id: profile.id });
      if (!ent || ent.length === 0) continue;

      // Refeições de hoje (pra pular lembrete de refeição já cumprida)
      const { data: todayMeals } = await supabase
        .from("food_analyses")
        .select("created_at")
        .eq("user_id", profile.id)
        .gte("created_at", startOfTodayBRT().toISOString());
      const mealHoursBRT = (todayMeals || []).map((r: any) =>
        new Date(new Date(r.created_at).getTime() - BRT_OFFSET_MS).getUTCHours());

      if (slot === "almoco" && mealHoursBRT.some((h) => h >= 11)) continue;
      if (slot === "jantar" && mealHoursBRT.some((h) => h >= 18)) continue;

      const firstName = (profile.full_name || "").trim().split(/\s+/)[0] || "";
      const oi = firstName ? `${firstName}, ` : "";
      const goal = profile.goal || null;

      let body = "";
      if (slot === "agua_manha") {
        body = `💧 ${oi}pausa de 10 segundos: já bebeu água hoje?\n\nDois copos agora te colocam no ritmo — a meta do dia é uns 2-3L. 😉`;
      } else if (slot === "almoco") {
        const flavor = goal === "ganhar_massa"
          ? "Capricha na proteína! 🍗"
          : goal === "emagrecer"
          ? "Boa hora pra uma escolha leve e cheia de fibras. 🥦"
          : "Monta um prato colorido e equilibrado. 🥗";
        body = `🍽️ ${oi}hora do almoço! ${flavor}\n\nQuando o prato estiver pronto, me manda a *foto* que eu analiso na hora. 📸`;
      } else if (slot === "agua_tarde") {
        body = `💧 ${oi}tarde corrida? Respira e bebe uma água agora — seu treino e sua energia agradecem. 😉`;
      } else {
        body = `🌙 ${oi}já pensou no jantar?\n\nMe manda a *foto do prato* quando for comer que eu fecho o balanço do seu dia. 📸`;
      }

      const res = await sendWA(EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE, ses.phone_number, body);
      if (!res.ok) {
        console.error(`Falha ao enviar lembrete pra ${ses.phone_number}:`, res.status, await res.text());
        continue;
      }

      // Marca o slot como enviado (guarda só o dia atual pra não crescer)
      await supabase
        .from("whatsapp_sessions")
        .update({ temp_data: { ...tempData, reminders: { [today]: [...sentToday, slot] } } })
        .eq("phone_number", ses.phone_number);

      sent++;
      results.push({ phone: ses.phone_number, slot });
    } catch (e) {
      console.error(`Erro no lembrete de ${ses.phone_number}:`, e);
    }
  }

  return { slot, candidates: (sessions || []).length, sent, results };
}
