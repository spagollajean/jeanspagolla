import * as wmill from "windmill-client";
import { generatePhoneCandidates } from "/u/admin/lib_whatsapp";
/**
 * Windmill Script 4: Send Interactive Menu
 *
 * Menu interativo do WhatsApp:
 * - Mensagem principal: banner + saudação personalizada (nome + streak de dias
 *   consecutivos registrando, calculado na hora do food_analyses — não existe
 *   coluna de streak no banco) + botões de 1 toque pras 2 ações principais.
 * - "Mais opções" abre uma lista (Resumo de Hoje, Meu Painel, Como funciona).
 * - "Meu Painel" responde com botão cta_url que abre o site direto.
 */

export async function main(remote_jid: string, interactive_id?: string) {
  const META_ACCESS_TOKEN = await wmill.getVariable("u/admin/META_ACCESS_TOKEN") as string;
  const META_PHONE_NUMBER_ID = await wmill.getVariable("u/admin/META_PHONE_NUMBER_ID") as string;
  const GRAPH_API_URL = "https://graph.facebook.com/v19.0";

  const url = `${GRAPH_API_URL}/${META_PHONE_NUMBER_ID}/messages`;

  async function sendWhatsAppMessage(payload: any) {
      const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${META_ACCESS_TOKEN}` },
          body: JSON.stringify(payload)
      });
      if (!res.ok) console.error("Falha ao enviar msg", await res.text());
  }

  function textMsg(body: string) {
      return { messaging_product: "whatsapp", recipient_type: "individual", to: remote_jid, type: "text", text: { body } };
  }

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

  // Pergunta de meta (3 botões goal_*) — usada na 1ª conversa e no "Minha Meta"
  async function sendGoalQuestion(bodyText: string) {
      await sendWhatsAppMessage({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: remote_jid,
          type: "interactive",
          interactive: {
              type: "button",
              body: { text: bodyText },
              footer: { text: "Dá pra trocar depois em Mais opções" },
              action: {
                  buttons: [
                      { type: "reply", reply: { id: "goal_emagrecer", title: "🔥 Emagrecer" } },
                      { type: "reply", reply: { id: "goal_ganhar_massa", title: "💪 Ganhar massa" } },
                      { type: "reply", reply: { id: "goal_manter", title: "🥗 Comer melhor" } }
                  ]
              }
          }
      });
  }

  // 1. Tratar cliques (botões e itens da lista)
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
                  emagrecer: "🔥 *Meta registrada: Emagrecer!*\n\nAgora suas análises de prato, dieta e treino vão ser pensadas pra queima de gordura. Bora! 👇",
                  ganhar_massa: "💪 *Meta registrada: Ganhar massa!*\n\nAgora suas análises de prato, dieta e treino vão ser pensadas pra hipertrofia. Bora crescer! 👇",
                  manter: "🥗 *Meta registrada: Comer melhor!*\n\nAgora suas análises de prato, dieta e treino vão focar em equilíbrio e qualidade nutricional. 👇"
              };
              await sendWhatsAppMessage(textMsg(confirmByGoal[chosenGoal]));
          }
          interactive_id = undefined; // segue pro menu principal
      }

      if (interactive_id === "action_food") {
          await supabase.from("whatsapp_sessions").update({ state: "IDLE" }).eq("phone_number", remote_jid.replace(/\D/g, ""));
          await sendWhatsAppMessage(textMsg("🥗 *Para iniciar, me envie uma foto do seu prato de comida!*"));
          return { success: true, handled_click: true };
      }

      if (interactive_id === "action_coach") {
          await supabase.from("whatsapp_sessions").update({ state: "AWAITING_BODY_PHOTO" }).eq("phone_number", remote_jid.replace(/\D/g, ""));
          await sendWhatsAppMessage(textMsg("🏋️ *Para gerar sua Dieta e Treino personalizados, me envie uma foto do seu corpo inteiro* (de preferência de frente, com roupa de treino)."));
          return { success: true, handled_click: true, new_state: "AWAITING_BODY_PHOTO" };
      }

      if (interactive_id === "action_more") {
          await sendWhatsAppMessage({
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: remote_jid,
              type: "interactive",
              interactive: {
                  type: "list",
                  header: { type: "text", text: "Mais opções" },
                  body: { text: "O que você quer ver?" },
                  footer: { text: "Viora · app.jeanspagolla.com.br" },
                  action: {
                      button: "Escolher",
                      sections: [{
                          title: "Viora",
                          rows: [
                              { id: "action_summary", title: "📊 Resumo de Hoje", description: "Calorias, proteína e sequência de dias registrando" },
                              { id: "action_change_goal", title: "🎯 Minha Meta", description: "Ver ou trocar sua meta (emagrecer, massa, comer melhor)" },
                              { id: "action_dashboard", title: "📱 Meu Painel", description: "Histórico completo, evolução e assinatura no site" },
                              { id: "action_help", title: "❓ Como funciona", description: "O que eu sei fazer e como usar cada função" }
                          ]
                      }]
                  }
              }
          });
          return { success: true, handled_click: true };
      }

      if (interactive_id === "action_change_goal") {
          const goalLabels: Record<string, string> = { emagrecer: "🔥 Emagrecer", ganhar_massa: "💪 Ganhar massa", manter: "🥗 Comer melhor" };
          const current = userGoal ? `Sua meta atual é *${goalLabels[userGoal] || userGoal}*.\n\n` : "";
          await sendGoalQuestion(`🎯 ${current}Qual meta você quer seguir a partir de agora?`);
          return { success: true, handled_click: true };
      }

      if (interactive_id === "action_summary") {
          const t = await getTodayAndStreak();
          let body: string;
          if (!uid) {
              body = "📊 Você ainda não tem conta — me manda a foto de um prato que a gente começa! 🥗";
          } else if (t.meals === 0) {
              body = "📊 *Resumo de Hoje*\n\nNenhuma refeição registrada ainda.\n\nMe manda a foto do seu próximo prato! 🥗" + (t.streak > 0 ? `\n\n🔥 Sequência em risco: *${t.streak} ${t.streak === 1 ? "dia" : "dias"}* registrando até ontem.` : "");
          } else {
              body = `📊 *Resumo de Hoje*\n\n• 🔥 *${Math.round(t.kcal)} kcal* consumidas\n• 🍗 *${Math.round(t.prot)}g* de proteína\n• 🍽️ *${t.meals}/8* análises do dia` + (t.streak >= 2 ? `\n\n🔥 *${t.streak} dias seguidos* registrando — não quebra a corrente!` : "");
          }
          await sendWhatsAppMessage(textMsg(body));
          return { success: true, handled_click: true };
      }

      if (interactive_id === "action_dashboard") {
          await sendWhatsAppMessage({
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: remote_jid,
              type: "interactive",
              interactive: {
                  type: "cta_url",
                  body: { text: "📱 *Seu painel completo*\n\nHistórico de refeições, evolução física, PDFs dos seus planos e gestão da assinatura." },
                  action: { name: "cta_url", parameters: { display_text: "Abrir Meu Painel", url: "https://app.jeanspagolla.com.br/dashboard" } }
              }
          });
          return { success: true, handled_click: true };
      }

      if (interactive_id === "action_help") {
          await sendWhatsAppMessage(textMsg("❓ *Como funciona o Viora*\n\n• 🥗 *Analisar refeição:* me envie a foto de qualquer prato e eu devolvo calorias, macros e dicas na hora.\n• 🏋️ *Dieta e Treino:* toque em Dieta e Treino, me envie uma foto do corpo inteiro, e eu monto seu plano completo em PDF.\n• 📊 *Resumo de Hoje:* seu balanço diário de calorias e proteína.\n\nQualquer hora, é só digitar *menu* pra me chamar. 💚"));
          return { success: true, handled_click: true };
      }
  }

  // 1.5 Primeira conversa sem meta definida: pergunta a meta ANTES do menu.
  // A resposta volta como clique goal_* e é tratada no bloco acima (sem state novo).
  if (uid && !userGoal) {
      await sendGoalQuestion(`${firstName ? `Oi, *${firstName}*! 👋 ` : ""}Antes de começar, me conta: *qual é a sua meta principal?* 🎯\n\nVou usar isso pra personalizar suas análises de prato, sua dieta e seu treino.`);
      return { success: true, goal_question_sent: true };
  }

  // 2. Menu principal: banner + saudação personalizada + botões
  const t = await getTodayAndStreak();

  let greeting = firstName ? `Oi, *${firstName}*! 👋` : "Oi! 👋 Eu sou o *Viora*, seu nutricionista e personal de bolso.";
  if (t.streak >= 2) {
      greeting += `\n🔥 *${t.streak} dias seguidos* registrando refeições — continue assim!`;
  }
  const pitch = "\n\n🥗 Mande a *foto de um prato* que eu analiso as calorias e macros.\n🏋️ Ou crie sua *dieta e treino* personalizados.";

  const resumoFooter = t.meals > 0
      ? `📊 Hoje: ${Math.round(t.kcal)} kcal · ${Math.round(t.prot)}g proteína`
      : "Toque em uma opção 👇";

  const MENU_BANNER_URL = "https://mnhgpnqkwuqzpvfrwftp.supabase.co/storage/v1/object/public/consultas/assets/menu_banner.png";

  await sendWhatsAppMessage({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: remote_jid,
      type: "interactive",
      interactive: {
          type: "button",
          header: { type: "image", image: { link: MENU_BANNER_URL } },
          body: { text: greeting + pitch },
          footer: { text: resumoFooter },
          action: {
              buttons: [
                  { type: "reply", reply: { id: "action_food", title: "🥗 Avaliar Prato" } },
                  { type: "reply", reply: { id: "action_coach", title: "🏋️ Dieta e Treino" } },
                  { type: "reply", reply: { id: "action_more", title: "📋 Mais opções" } }
              ]
          }
      }
  });

  return { success: true, menu_sent: true };
}
