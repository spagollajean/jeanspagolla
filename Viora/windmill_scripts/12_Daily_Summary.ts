//nobundling
import * as wmill from "windmill-client";
import { createClient } from "@supabase/supabase-js";
import { generatePhoneCandidates, sendWhatsAppMessage as sendWA } from "/u/admin/lib_whatsapp";

/**
 * Resumo / lembrete diário do Viora.
 * Roda agendado (ex.: 21h BRT). Envia SÓ para quem mandou mensagem nas
 * últimas ~23h (evita mandar mensagem pra quem sumiu -- a Evolution/WhatsApp
 * pessoal nao tem a restricao de janela de 24h da Meta Business API, mas
 * mandar sem parcimonia pra numero inativo aumenta risco de o WhatsApp
 * marcar o numero como spam). Resume as refeições do dia ou dá um empurrão.
 */

export async function main() {
  const EVOLUTION_API_URL = await wmill.getVariable("u/admin/EVOLUTION_API_URL") as string;
  const EVOLUTION_API_KEY = await wmill.getVariable("u/admin/EVOLUTION_API_KEY") as string;
  const EVOLUTION_INSTANCE = await wmill.getVariable("u/admin/EVOLUTION_INSTANCE") as string;
  const SUPABASE_URL = await wmill.getVariable("u/admin/SUPABASE_URL") as string;
  const SUPABASE_KEY = await wmill.getVariable("u/admin/SUPABASE_SERVICE_ROLE_KEY") as string;
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Janela grátis: interagiu nas últimas 23h
  const since = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();
  const { data: sessions } = await supabase
    .from("whatsapp_sessions")
    .select("phone_number, updated_at")
    .gte("updated_at", since);

  // Início do dia (Brasília)
  const startBR = new Date(Date.now() - 3 * 60 * 60 * 1000);
  startBR.setUTCHours(3, 0, 0, 0);

  let sent = 0, skipped = 0;

  for (const s of sessions || []) {
    const phone = s.phone_number as string;
    const cands = generatePhoneCandidates(phone);

    let user: any = null;
    for (const c of cands) {
      const { data } = await supabase.from("profiles").select("id").eq("phone", c).maybeSingle();
      if (data) { user = data; break; }
    }
    if (!user) { skipped++; continue; }

    // Só assinantes ativos (não incomodar quem não é PRO)
    const { data: entitlement } = await supabase.rpc('get_active_entitlement', { p_user_id: user.id });
    if (!entitlement || entitlement.length === 0) { skipped++; continue; }

    // Refeições de hoje — com TODAS as leituras que o card individual registra
    // (o resumo antigo só somava kcal+proteína e vinha "pela metade")
    const { data: rows } = await supabase
      .from("food_analyses")
      .select("food_name, total_calories, total_protein, total_carbs, total_fat, total_fiber, total_sodium_mg, nutrition_score, calories, protein, carbs, fat, score, created_at")
      .eq("user_id", user.id)
      .gte("created_at", startBR.toISOString())
      .order("created_at", { ascending: true });

    const n = (rows || []).length;
    let kcal = 0, prot = 0, carbs = 0, fat = 0, fiber = 0, sodium = 0;
    let scoreSum = 0, scoreCount = 0;
    const mealLines: string[] = [];

    for (const r of (rows || []) as any[]) {
      const mealKcal = Number(r.total_calories ?? r.calories ?? 0);
      kcal += mealKcal;
      prot += Number(r.total_protein ?? r.protein ?? 0);
      carbs += Number(r.total_carbs ?? r.carbs ?? 0);
      fat += Number(r.total_fat ?? r.fat ?? 0);
      fiber += Number(r.total_fiber ?? 0);
      sodium += Number(r.total_sodium_mg ?? 0);
      const score = Number(r.nutrition_score ?? r.score ?? 0);
      if (score > 0) { scoreSum += score; scoreCount++; }
      if (mealLines.length < 6) {
        mealLines.push(`• ${r.food_name || "Refeição"} — ${Math.round(mealKcal)} kcal`);
      }
    }
    if (n > 6) mealLines.push(`• ...e mais ${n - 6}`);

    const avgScore = scoreCount > 0 ? (scoreSum / scoreCount).toFixed(1) : null;

    const body = n > 0
      ? `📊 *Resumo de hoje*\n\n🍽️ *${n} ${n === 1 ? "refeição" : "refeições"}:*\n${mealLines.join("\n")}\n\n🔥 *${Math.round(kcal)}* kcal\n🍗 Proteína: *${Math.round(prot)}g*\n🍞 Carbo: *${Math.round(carbs)}g* · 🥑 Gordura: *${Math.round(fat)}g*\n🌾 Fibra: *${Math.round(fiber)}g* · 🧂 Sódio: *${Math.round(sodium)}mg*${avgScore ? `\n⭐ Nota média dos pratos: *${avgScore}/10*` : ""}\n\nMandou bem! Amanhã tem mais 💪`
      : `👀 Vi que você passou por aqui hoje mas não registrou nenhuma refeição.\n\nQue tal mandar a foto da próxima? Leva 5 segundos e eu cuido do resto! 🍽️`;

    const res = await sendWA(EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE, phone, body);
    if (res.ok) sent++; else { skipped++; console.error("Falha envio", phone, await res.text()); }
  }

  return { total_sessions: (sessions || []).length, sent, skipped };
}
