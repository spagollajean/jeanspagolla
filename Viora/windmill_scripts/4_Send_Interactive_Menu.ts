import * as wmill from "windmill-client";
import { generatePhoneCandidates, sendWhatsAppMessage as sendWA } from "/u/admin/lib_whatsapp";
/**
 * Windmill Script 4: Send Interactive Menu
 *
 * Menu do WhatsApp em texto numerado -- a Evolution API (WhatsApp Web/QR,
 * conta pessoal) nao suporta de forma confiavel os botoes/listas interativas
 * exclusivos do WhatsApp Business Cloud API da Meta. `interactive_id` chega
 * aqui do mesmo jeito de antes (o Extract_Payload converte a resposta
 * numerica do usuario pro mesmo conjunto de IDs que este script ja espera),
 * entao a logica de negocio (metas, streak etc.) fica igual.
 */

export async function main(remote_jid: string, interactive_id?: string) {
  const EVOLUTION_API_URL = await wmill.getVariable("u/admin/EVOLUTION_API_URL") as string;
  const EVOLUTION_API_KEY = await wmill.getVariable("u/admin/EVOLUTION_API_KEY") as string;
  const EVOLUTION_INSTANCE = await wmill.getVariable("u/admin/EVOLUTION_INSTANCE") as string;

  async function sendWhatsAppMessage(text: string) {
      await sendWA(EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE, remote_jid, text);
  }

  const DIVIDER = "▬▬▬▬▬▬▬▬▬▬▬▬";

  const { createClient } = require('@supabase/supabase-js');
  const SUPABASE_URL = await wmill.getVariable("u/admin/SUPABASE_URL");
  const SUPABASE_KEY = await wmill.getVariable("u/admin/SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Perfil (nome pra saudação; id pro resumo/streak; goal pra personalização)
  let uid: string | null = null;
  let firstName = "";
  let userGoal: string | null = null;
  try {
      const cands = generatePhoneCandidates(remote_jid.replace(/\D/g, ""));
      for (const c of cands) {
          const { data } = await supabase.from("profiles").select("id, full_name, goal").eq("phone", c).maybeSingle();
          if (data) {
              uid = data.id;
              firstName = (data.full_name || "").trim().split(/\s+/)[0] || "";
              userGoal = data.goal || null;
              break;
          }
      }
  } catch (e) {
      console.error("Busca de perfil falhou:", e);
  }

  // Balanço de hoje + streak de dias consecutivos (calculado do food_analyses)
  async function getTodayAndStreak(): Promise<{ kcal: number; prot: number; meals: number; streak: number }> {
      const out = { kcal: 0, prot: 0, meals: 0, streak: 0 };
      if (!uid) return out;
      try {
          const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
          const { data: rows } = await supabase
              .from("food_analyses")
              .select("created_at, total_calories, total_protein, calories, protein")
              .eq("user_id", uid)
              .gte("created_at", since.toISOString());

          const dayKey = (d: Date) => {
              const br = new Date(d.getTime() - 3 * 60 * 60 * 1000);
              return br.toISOString().slice(0, 10);
          };
          const today = dayKey(new Date());
          const days = new Set<string>();
          for (const r of rows || []) {
              const k = dayKey(new Date((r as any).created_at));
              days.add(k);
              if (k === today) {
                  out.meals++;
                  out.kcal += Number((r as any).total_calories ?? (r as any).calories ?? 0);
                  out.prot += Number((r as any).total_protein ?? (r as any).protein ?? 0);
              }
          }
          // Conta dias consecutivos terminando hoje (ou ontem, se hoje ainda não registrou)
          let cursor = new Date();
          if (!days.has(today)) cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
          while (days.has(dayKey(cursor))) {
              out.streak++;
              cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
          }
      } catch (e) {
          console.error("Resumo/streak falhou:", e);
      }
      return out;
  }

  // Pergunta de meta (agora em texto numerado) — usada na 1ª conversa e no "Minha Meta"
  async function sendGoalQuestion(bodyText: string) {
      await setMenuContext("goal");
      await sendWhatsAppMessage(
          `${bodyText}\n\n${DIVIDER}\n\n*1*  🔥  Emagrecer\n*2*  💪  Ganhar massa\n*3*  🥗  Comer melhor\n\n${DIVIDER}\n\n_Responda só com o número._`
      );
  }

  // O menu agora e texto numerado, entao "1"/"2"/"3" significam coisas
  // diferentes dependendo de qual menu foi mandado por ultimo (principal,
  // "mais opções" ou pergunta de meta). Guarda esse contexto em
  // whatsapp_sessions.temp_data pra resolver a resposta certa.
  const phoneKey = remote_jid.replace(/\D/g, "");
  async function setMenuContext(ctx: string) {
      const { data: session } = await supabase.from("whatsapp_sessions").select("temp_data").eq("phone_number", phoneKey).maybeSingle();
      const temp_data = { ...(session?.temp_data || {}), menu_context: ctx };
      await supabase.from("whatsapp_sessions").update({ temp_data }).eq("phone_number", phoneKey);
  }

  if (interactive_id?.startsWith("menu_option_")) {
      const n = interactive_id.slice("menu_option_".length);
      const { data: session } = await supabase.from("whatsapp_sessions").select("temp_data").eq("phone_number", phoneKey).maybeSingle();
      const ctx = session?.temp_data?.menu_context || "main";
      const MAPS: Record<string, Record<string, string>> = {
          main: { "1": "action_food", "2": "action_coach", "3": "action_more" },
          more: { "1": "action_summary", "2": "action_change_goal", "3": "action_dashboard", "4": "action_help" },
          goal: { "1": "goal_emagrecer", "2": "goal_ganhar_massa", "3": "goal_manter" },
      };
      interactive_id = MAPS[ctx]?.[n];
  }

  // 1. Tratar respostas (numeros digitados, resolvidos acima pro interactive_id certo)
  if (interactive_id) {
      // Resposta da pergunta de meta (goal_emagrecer | goal_ganhar_massa | goal_manter):
      // grava no perfil, confirma e CAI pro menu principal logo abaixo (sem return).
      if (interactive_id.startsWith("goal_")) {
          const chosenGoal = interactive_id.slice(5);
          if (uid && ["emagrecer", "ganhar_massa", "manter"].includes(chosenGoal)) {
              const { error: goalErr } = await supabase.from("profiles").update({ goal: chosenGoal }).eq("id", uid);
              if (goalErr) console.error("Falha ao salvar meta:", goalErr);
              userGoal = chosenGoal;
              const confirmByGoal: Record<string, string> = {
                  emagrecer: `🔥 *Meta registrada: Emagrecer*\n\nSuas análises de prato, dieta e treino agora são pensadas pra queima de gordura.`,
                  ganhar_massa: `💪 *Meta registrada: Ganhar massa*\n\nSuas análises de prato, dieta e treino agora são pensadas pra hipertrofia.`,
                  manter: `🥗 *Meta registrada: Comer melhor*\n\nSuas análises de prato, dieta e treino agora focam em equilíbrio e qualidade nutricional.`
              };
              await sendWhatsAppMessage(confirmByGoal[chosenGoal]);
          }
          interactive_id = undefined; // segue pro menu principal
      }

      if (interactive_id === "action_food") {
          await supabase.from("whatsapp_sessions").update({ state: "IDLE" }).eq("phone_number", remote_jid.replace(/\D/g, ""));
          await sendWhatsAppMessage(`🥗  *AVALIAR PRATO*\n\n${DIVIDER}\n\nMe manda a *foto do seu prato* — é só isso, eu cuido do resto. 📸`);
          return { success: true, handled_click: true };
      }

      if (interactive_id === "action_coach") {
          await supabase.from("whatsapp_sessions").update({ state: "AWAITING_BODY_PHOTO" }).eq("phone_number", remote_jid.replace(/\D/g, ""));
          await sendWhatsAppMessage(`🏋️  *DIETA E TREINO*\n\n${DIVIDER}\n\nMe manda uma *foto do seu corpo inteiro*, de frente, com roupa de treino — eu monto seu plano completo. 📸`);
          return { success: true, handled_click: true, new_state: "AWAITING_BODY_PHOTO" };
      }

      if (interactive_id === "action_more") {
          await setMenuContext("more");
          await sendWhatsAppMessage(
              `📋  *MAIS OPÇÕES*\n\n${DIVIDER}\n\n` +
              "*1*  📊  Resumo de Hoje\n" +
              "*2*  🎯  Minha Meta\n" +
              "*3*  📱  Meu Painel\n" +
              "*4*  ❓  Como funciona\n\n" +
              `${DIVIDER}\n\n_Responda só com o número._`
          );
          return { success: true, handled_click: true };
      }

      if (interactive_id === "action_change_goal") {
          const goalLabels: Record<string, string> = { emagrecer: "🔥 Emagrecer", ganhar_massa: "💪 Ganhar massa", manter: "🥗 Comer melhor" };
          const current = userGoal ? `Sua meta atual é *${goalLabels[userGoal] || userGoal}*.\n\n` : "";
          await sendGoalQuestion(`🎯  *MINHA META*\n\n${current}Qual meta você quer seguir a partir de agora?`);
          return { success: true, handled_click: true };
      }

      if (interactive_id === "action_summary") {
          const t = await getTodayAndStreak();
          let body: string;
          if (!uid) {
              body = `📊  *RESUMO DE HOJE*\n\n${DIVIDER}\n\nVocê ainda não tem conta — me manda a foto de um prato que a gente começa! 🥗`;
          } else if (t.meals === 0) {
              body = `📊  *RESUMO DE HOJE*\n\n${DIVIDER}\n\nNenhuma refeição registrada ainda hoje.\n\nMe manda a foto do seu próximo prato! 🥗` + (t.streak > 0 ? `\n\n🔥 Sequência em risco: *${t.streak} ${t.streak === 1 ? "dia" : "dias"}* registrando até ontem.` : "");
          } else {
              body = `📊  *RESUMO DE HOJE*\n\n${DIVIDER}\n\n🔥  *${Math.round(t.kcal)}* kcal consumidas\n🍗  Proteína: *${Math.round(t.prot)}g*\n🍽️  Análises do dia: *${t.meals}/8*` + (t.streak >= 2 ? `\n\n${DIVIDER}\n\n🔥 *${t.streak} dias seguidos* registrando — não quebra a corrente!` : "");
          }
          await sendWhatsAppMessage(body);
          return { success: true, handled_click: true };
      }

      if (interactive_id === "action_dashboard") {
          await sendWhatsAppMessage(`📱  *MEU PAINEL*\n\n${DIVIDER}\n\nHistórico de refeições, evolução física, PDFs dos seus planos e gestão da assinatura:\n\n👉 https://app.jeanspagolla.com.br/dashboard`);
          return { success: true, handled_click: true };
      }

      if (interactive_id === "action_help") {
          await sendWhatsAppMessage(
              `❓  *COMO FUNCIONA O VIORA*\n\n${DIVIDER}\n\n` +
              "🥗  *Avaliar prato* — mande a foto de qualquer refeição e eu devolvo calorias, macros e dicas na hora.\n\n" +
              "🏋️  *Dieta e treino* — mande uma foto do seu corpo inteiro e eu monto seu plano completo em PDF.\n\n" +
              "📊  *Resumo de hoje* — seu balanço diário de calorias e proteína.\n\n" +
              `${DIVIDER}\n\n_A qualquer momento, digite_ *menu* _pra me chamar._ 💚`
          );
          return { success: true, handled_click: true };
      }
  }

  // 1.5 Primeira conversa sem meta definida: pergunta a meta ANTES do menu.
  // A resposta volta como clique goal_* e é tratada no bloco acima (sem state novo).
  if (uid && !userGoal) {
      await sendGoalQuestion(`${firstName ? `Oi, *${firstName}*! 👋` : "Oi! 👋"}\n\nAntes de começar, me conta: *qual é a sua meta principal?* 🎯\n\nVou usar isso pra personalizar suas análises de prato, sua dieta e seu treino.`);
      return { success: true, goal_question_sent: true };
  }

  // 2. Menu principal: saudação personalizada + opções numeradas
  const t = await getTodayAndStreak();

  const greetingName = firstName ? `Oi, *${firstName}*! 👋` : "Oi! 👋";
  const streakLine = t.streak >= 2
      ? `\n🔥 *${t.streak} dias seguidos* registrando refeições — continue assim!`
      : "";

  const resumoFooter = t.meals > 0
      ? `📊 Hoje: *${Math.round(t.kcal)} kcal* · *${Math.round(t.prot)}g* proteína\n\n`
      : "";

  const menuText =
      `✨  *VIORA*  —  seu coach de bolso\n\n` +
      `${greetingName}${streakLine}\n\n` +
      `${DIVIDER}\n\n` +
      "*1*   🥗   Avaliar Prato\n" +
      "*2*   🏋️   Dieta e Treino\n" +
      "*3*   📋   Mais opções\n\n" +
      `${DIVIDER}\n\n` +
      resumoFooter +
      "_Responda com o número, ou já manda a foto do prato direto._";

  await setMenuContext("main");
  await sendWhatsAppMessage(menuText);

  return { success: true, menu_sent: true };
}
