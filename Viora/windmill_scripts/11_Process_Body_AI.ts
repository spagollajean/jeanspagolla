//nobundling
import * as wmill from "windmill-client";
import { createClient } from "@supabase/supabase-js";
import { generatePhoneCandidates, markReadWithTyping, sendWhatsAppMessage as sendWA, getMediaBase64 } from "/u/admin/lib_whatsapp";

/**
 * Windmill Script 11: Process Body AI (Dieta e Treino) with OpenAI
 *
 * Salva a foto enviada no bucket coach-uploads e compara o físico atual
 * com a avaliação anterior do usuário (evolution_notes).
 */

function buildCoachPdfHtml(plan: any): string {
  const a = plan.analysis || {};
  const w = plan.workout || {};
  const diet = plan.diet || {};
  const quote = plan.motivation_quote || "";

  // A IA ocasionalmente vaza caracteres de outros alfabetos no meio de palavras
  // (ex: "Terra رومeno" num PDF real) — remove qualquer coisa fora do latino.
  const tx = (s: any) => String(s ?? "").replace(/[^\u0020-\u024F\u1E00-\u1EFF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026]/gu, "").trim();

  const days = (w.routine || []).map((d: any) => {
    const rows = (d.exercises || []).map((ex: any) => `<tr><td class="ex">${tx(ex.name)}</td><td class="sr">${tx(ex.sets)}x ${tx(ex.reps)}</td><td class="tc">${tx(ex.technique) || "—"}</td></tr>`).join("");
    return `<div class="daycard"><div class="dayhead"><span class="daytag">${tx(d.day)}</span><span class="daymg">${tx(d.muscle_group)}</span></div><table class="extbl"><thead><tr><th>Exercício</th><th>Séries</th><th>Técnica</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }).join("");

  const meals = (diet.meal_plan_example || []).map((m: any) => {
    const opts = (m.options || []).map((o: string) => `<li>${tx(o)}</li>`).join("");
    return `<div class="meal"><div class="mealhead"><h4>${tx(m.name) || "Refeição"}</h4><span class="time">${tx(m.time_range)}</span></div><ul class="opts">${opts}</ul>${m.substitution_suggestion ? `<div class="subs"><b>Troca:</b> ${tx(m.substitution_suggestion)}</div>` : ""}</div>`;
  }).join("");

  const supps = (diet.supplements || []).map((s: any) => {
    const n = tx(typeof s === 'string' ? s : (s.name || ""));
    const dg = tx(typeof s === 'string' ? '' : (s.dosage || ''));
    const r = tx(typeof s === 'string' ? '' : (s.reason || ''));
    return `<div class="supp"><div class="sn">${n}${dg ? ` <span class="sd">${dg}</span>` : ''}</div>${r ? `<div class="sr2">${r}</div>` : ''}</div>`;
  }).join("");

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  @page{size:A4;margin:0;}
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Plus Jakarta Sans',sans-serif;color:#0f172a;-webkit-print-color-adjust:exact !important;}
  .doc{width:794px;min-height:1123px;margin:0 auto;background:#fff;padding:32px 40px;}
  .doc.pagebreak{page-break-before:always;}
  .brandbar{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #16a34a;padding-bottom:11px;margin-bottom:15px;}
  .brand{font-size:24px;font-weight:800;letter-spacing:-.02em;}.brand .d{color:#16a34a;}
  .doctype{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:#16a34a;margin-bottom:2px;}
  .date{font-size:10px;color:#94a3b8;font-weight:600;text-align:right;}
  .h2{font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#1e293b;margin:15px 0 10px;display:flex;align-items:center;gap:8px;}
  .h2:before{content:'';width:5px;height:18px;background:#16a34a;border-radius:3px;}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
  .stat{background:#f8fafc;border:1px solid #e8edf5;border-radius:12px;padding:10px 13px;}
  .stat .l{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin-bottom:3px;}
  .stat .v{font-size:16px;font-weight:800;}
  .daycard{border:1px solid #e8edf5;border-radius:12px;overflow:hidden;margin-bottom:9px;page-break-inside:avoid;}
  .dayhead{background:#0f172a;display:flex;justify-content:space-between;align-items:center;padding:7px 14px;}
  .daytag{background:#16a34a;color:#fff;font-size:10px;font-weight:800;text-transform:uppercase;padding:3px 9px;border-radius:7px;}
  .daymg{color:#fff;font-size:13px;font-weight:800;text-transform:uppercase;}
  .extbl{width:100%;border-collapse:collapse;table-layout:fixed;}
  .extbl th{text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;color:#94a3b8;padding:4px 12px;border-bottom:1px solid #eef2f7;}
  .extbl th:nth-child(1){width:38%;}.extbl th:nth-child(2){text-align:center;width:17%;}.extbl th:nth-child(3){text-align:right;}
  .extbl td{padding:5px 12px;border-bottom:1px solid #f4f6fb;font-size:11.5px;}
  .extbl tr:last-child td{border-bottom:0;}
  .extbl .ex{font-weight:700;color:#1e293b;}
  .extbl .sr{text-align:center;font-weight:800;color:#16a34a;white-space:nowrap;}
  .extbl .tc{text-align:right;font-size:10px;font-style:italic;color:#64748b;line-height:1.3;}
  .dietbar{display:grid;grid-template-columns:1.3fr 1fr 1fr 1fr;background:#0f172a;border-radius:14px;overflow:hidden;}
  .dietbar .c{padding:13px 16px;border-right:1px solid #1e293b;}.dietbar .c:last-child{border-right:0;}
  .dietbar .l{font-size:9px;font-weight:700;text-transform:uppercase;margin-bottom:3px;}
  .dietbar .cal .l{color:#fca5a5;}.dietbar .p .l{color:#a5b4fc;}.dietbar .cb .l{color:#6ee7b7;}.dietbar .f .l{color:#fcd34d;}
  .dietbar .v{font-size:20px;font-weight:800;color:#fff;}.dietbar .v small{font-size:10px;font-weight:500;color:#94a3b8;}
  .meal{border:1px solid #e8edf5;border-radius:12px;padding:11px 16px;margin-bottom:9px;page-break-inside:avoid;}
  .mealhead{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;border-bottom:1px solid #f1f5f9;padding-bottom:5px;}
  .mealhead h4{font-size:13px;font-weight:800;text-transform:uppercase;color:#1e293b;}
  .time{font-size:10px;font-weight:700;color:#16a34a;background:#f0fdf4;border:1px solid #dcfce7;padding:2px 9px;border-radius:9999px;}
  .opts{list-style:none;}.opts li{font-size:12px;color:#334155;margin-bottom:4px;padding-left:15px;position:relative;}
  .opts li:before{content:'';position:absolute;left:0;top:6px;width:6px;height:6px;border-radius:50%;background:#10b981;}
  .subs{margin-top:6px;font-size:11px;color:#92400e;background:#fffbeb;border-left:3px solid #f59e0b;padding:6px 11px;border-radius:0 7px 7px 0;}
  .suppwrap{display:grid;grid-template-columns:1fr 1fr;gap:9px;}
  .supp{background:#f8fafc;border:1px solid #e8edf5;border-radius:10px;padding:9px 13px;}
  .sn{font-size:12px;font-weight:800;color:#1e293b;}.sd{font-size:10px;font-weight:700;color:#15803d;background:#f0fdf4;padding:1px 6px;border-radius:5px;}
  .sr2{font-size:11px;color:#64748b;margin-top:2px;font-style:italic;}
  .hydro{margin-top:9px;background:#0f172a;border-radius:10px;padding:10px 15px;display:flex;justify-content:space-between;align-items:center;}
  .hydro .l{color:#94a3b8;font-size:10px;font-weight:700;text-transform:uppercase;}.hydro .v{color:#fff;font-size:15px;font-weight:800;}
  .quote{margin-top:14px;text-align:center;padding:12px;border-top:1px solid #e8edf5;}
  .quote p{font-size:12.5px;font-style:italic;color:#475569;}
  </style></head><body>

  <div class="doc">
    <div class="brandbar"><div><div class="doctype">Protocolo Titan • Treino</div><div class="brand">Viora<span class="d">.</span></div></div><div class="date">Emitido em<br>${new Date().toLocaleDateString('pt-BR')}</div></div>
    <div class="stats"><div class="stat"><div class="l">Biótipo</div><div class="v">${tx(a.somatotype) || "—"}</div></div><div class="stat"><div class="l">Gordura Est.</div><div class="v">~${a.body_fat_percentage || "—"}%</div></div><div class="stat"><div class="l">Massa</div><div class="v">${tx(a.muscle_mass_level) || "—"}</div></div><div class="stat"><div class="l">Foco</div><div class="v">${tx(w.focus) || "—"}</div></div></div>
    <div class="h2">Divisão de Treino — ${tx(w.split)} (${w.frequency_days || 0}x/semana)</div>
    ${days}
  </div>

  <div class="doc pagebreak">
    <div class="brandbar"><div><div class="doctype">Protocolo Titan • Dieta</div><div class="brand">Viora<span class="d">.</span></div></div><div class="date">Meta Calórica<br><b style="color:#0f172a;font-size:13px">${diet.total_calories || 0} kcal</b></div></div>
    <div class="dietbar"><div class="c cal"><div class="l">Calorias / Dia</div><div class="v">${diet.total_calories || 0} <small>kcal</small></div></div><div class="c p"><div class="l">Proteínas</div><div class="v">${diet.macros?.protein_g || 0}<small>g</small></div></div><div class="c cb"><div class="l">Carboidratos</div><div class="v">${diet.macros?.carbs_g || 0}<small>g</small></div></div><div class="c f"><div class="l">Gorduras</div><div class="v">${diet.macros?.fats_g || 0}<small>g</small></div></div></div>
    <div class="h2">Cardápio do Dia</div>
    ${meals}
    <div class="h2">Suplementação</div>
    <div class="suppwrap">${supps}</div>
    <div class="hydro"><div class="l">Meta de Hidratação</div><div class="v">${diet.hydration_liters || 3.0} L / dia</div></div>
    ${quote ? `<div class="quote"><p>"${tx(quote)}"</p></div>` : ''}
  </div>

  <script>
  // Auto-fit: encolhe cada seção (.doc) só o necessário pra caber em 1 página
  // A4 (1123px). Usa zoom (afeta layout, então a paginação acompanha) e
  // compensa a largura pra seção continuar ocupando a página inteira.
  // Piso de 0.66: abaixo disso deixa quebrar em 2 páginas em vez de ficar ilegível.
  function fitPages() {
    // Mira 14px abaixo da altura da página: o arredondamento da impressão já
    // estourou 1-2px e jogou a frase final numa 3ª página sozinha.
    var PAGE_H = 1123, SAFE_H = PAGE_H - 14, PAGE_W = 794, FLOOR = 0.66;
    document.querySelectorAll('.doc').forEach(function (d) {
      var z = 1;
      for (var i = 0; i < 5; i++) {
        d.style.zoom = z;
        d.style.width = (PAGE_W / z) + 'px';
        var h = d.scrollHeight, max = SAFE_H / z;
        if (h <= max) break;
        z = Math.max(FLOOR, +(z * (max / h)).toFixed(3));
        if (z === FLOOR) { d.style.zoom = z; d.style.width = (PAGE_W / z) + 'px'; break; }
      }
    });
  }
  fitPages();
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(fitPages); }
  </script>
  </body></html>`;
}

// Card PNG de resumo da avaliação (mesma identidade do card de comida do
// script 3). Sem a foto do corpo de propósito — o card é "compartilhável".
function buildCoachCardHtml(plan: any, firstName: string): string {
  const a = plan.analysis || {};
  const w = plan.workout || {};
  const diet = plan.diet || {};
  const quote = plan.motivation_quote || "";
  const tx = (s: any) => String(s ?? "").replace(/[^ -ɏḀ-ỿ–—‘’“”•…]/gu, "").trim();
  const dateBR = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  // Bullets curtos no card; o texto longo (evolution_notes) fica pro dashboard.
  // Fallback: se a IA não mandar highlights, quebra o texto longo em tópicos.
  let evoBullets: string[] = Array.isArray(a.evolution_highlights) ? a.evolution_highlights : [];
  if (!evoBullets.length && a.evolution_notes) {
      evoBullets = String(a.evolution_notes).split(/\s*[-–]\s+|\.\s*-\s*/).map((s: string) => s.trim()).filter(Boolean);
  }
  evoBullets = evoBullets.slice(0, 4).map((b) => {
      const clean = tx(b).replace(/\.$/, "");
      return clean.length > 90 ? clean.slice(0, 87) + "…" : clean;
  }).filter(Boolean);

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Plus Jakarta Sans',sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased;}
  .wrap{width:1080px;background:#f1f5f9;padding:44px;}
  .card{background:#fff;border-radius:32px;padding:44px;border:1px solid #e2e8f0;}
  .head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
  .brand{font-size:38px;font-weight:800;letter-spacing:-.02em;}.brand .d{color:#16a34a;}
  .badge{background:#f0fdf4;border:2px solid #bbf7d0;color:#15803d;font-size:20px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;padding:10px 22px;border-radius:9999px;}
  .stamp{font-size:20px;color:#94a3b8;font-weight:600;margin-bottom:30px;}
  .tiles{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:26px;}
  .tile{border-radius:24px;padding:26px 30px;border:1px solid transparent;}
  .tile .l{font-size:19px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;}
  .tile .v{font-size:42px;font-weight:800;line-height:1.1;}
  .t-fat{background:#fff7ed;border-color:#fed7aa;}.t-fat .l{color:#c2410c;}.t-fat .v{color:#ea580c;}
  .t-mass{background:#eff6ff;border-color:#bfdbfe;}.t-mass .l{color:#1d4ed8;}.t-mass .v{color:#2563eb;font-size:34px;}
  .t-bio{background:#f5f3ff;border-color:#ddd6fe;}.t-bio .l{color:#6d28d9;}.t-bio .v{color:#7c3aed;font-size:34px;}
  .t-foco{background:#f0fdf4;border-color:#bbf7d0;}.t-foco .l{color:#15803d;}.t-foco .v{color:#16a34a;font-size:34px;}
  .plan{display:flex;gap:14px;margin-bottom:26px;flex-wrap:wrap;}
  .chip{background:#f1f5f9;border:1px solid #e2e8f0;padding:14px 24px;border-radius:9999px;font-size:23px;font-weight:700;color:#475569;}
  .evo{background:#eef2ff;border:1px solid #e0e7ff;border-radius:24px;padding:26px 30px;margin-bottom:26px;}
  .evo .h{font-size:23px;font-weight:800;color:#4338ca;margin-bottom:12px;}
  .evo ul{list-style:none;}
  .evo li{font-size:23px;color:#3730a3;line-height:1.4;margin-bottom:9px;padding-left:26px;position:relative;}
  .evo li:last-child{margin-bottom:0;}
  .evo li:before{content:'';position:absolute;left:0;top:11px;width:10px;height:10px;border-radius:50%;background:#6366f1;}
  .coach{background:#0f172a;border-radius:24px;padding:30px 34px;}
  .coach .h{font-size:22px;font-weight:800;color:#fff;margin-bottom:12px;display:flex;align-items:center;gap:12px;}
  .coach .t{font-size:24px;font-style:italic;color:#cbd5e1;line-height:1.5;border-left:4px solid #16a34a;padding-left:20px;}
  .foot{text-align:center;font-size:21px;color:#94a3b8;font-weight:600;padding-top:30px;}
  </style></head><body>
  <div class="wrap"><div id="capture">
    <div class="card">
      <div class="head"><div class="brand">Viora<span class="d">.</span></div><div class="badge">Avaliação Física</div></div>
      <div class="stamp">Avaliação de ${tx(firstName) || "hoje"} • ${dateBR}</div>
      <div class="tiles">
        <div class="tile t-fat"><div class="l">Gordura Estimada</div><div class="v">~${a.body_fat_percentage || "—"}%</div></div>
        <div class="tile t-mass"><div class="l">Massa Muscular</div><div class="v">${tx(a.muscle_mass_level) || "—"}</div></div>
        <div class="tile t-bio"><div class="l">Biótipo</div><div class="v">${tx(a.somatotype) || "—"}</div></div>
        <div class="tile t-foco"><div class="l">Foco</div><div class="v">${tx(w.focus) || "—"}</div></div>
      </div>
      <div class="plan">
        ${w.split ? `<div class="chip"><b>TREINO</b>&nbsp; ${tx(w.split)} · ${w.frequency_days || 0}x/semana</div>` : ""}
        ${diet.total_calories ? `<div class="chip"><b>DIETA</b>&nbsp; ${diet.total_calories} kcal/dia</div>` : ""}
        ${diet.hydration_liters ? `<div class="chip"><b>ÁGUA</b>&nbsp; ${diet.hydration_liters} L/dia</div>` : ""}
      </div>
      ${evoBullets.length ? `<div class="evo"><div class="h">↗ Sua Evolução</div><ul>${evoBullets.map((b) => `<li>${b}</li>`).join("")}</ul></div>` : ""}
      ${quote ? `<div class="coach"><div class="h">Seu coach diz:</div><div class="t">"${tx(quote)}"</div></div>` : ""}
    </div>
    <div class="foot">Plano completo de treino e dieta no PDF abaixo &nbsp;·&nbsp; app.jeanspagolla.com.br</div>
  </div></div>
  </body></html>`;
}

export async function main(
  sender_number: string,
  remote_jid: string,
  message_id: string,
  media_id: string,
  user_id?: string
) {
  const SUPABASE_URL = await wmill.getVariable("u/admin/SUPABASE_URL") as string;
  const SUPABASE_KEY = await wmill.getVariable("u/admin/SUPABASE_SERVICE_ROLE_KEY") as string;
  const OPENAI_API_KEY = await wmill.getVariable("u/admin/OPENAI_API_KEY") as string;
  const EVOLUTION_API_URL = await wmill.getVariable("u/admin/EVOLUTION_API_URL") as string;
  const EVOLUTION_API_KEY = await wmill.getVariable("u/admin/EVOLUTION_API_KEY") as string;
  const EVOLUTION_INSTANCE = await wmill.getVariable("u/admin/EVOLUTION_INSTANCE") as string;

  if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_API_KEY || !EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
    throw new Error("Missing required environment variables.");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  async function sendWhatsAppMessage(text: string) {
    await sendWA(EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE, remote_jid, text);
  }

  async function sendWhatsAppImage(link: string, caption?: string) {
    await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${EVOLUTION_INSTANCE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
        body: JSON.stringify({ number: remote_jid, mediatype: "image", media: link, caption: caption || undefined })
    });
  }

  async function sendWhatsAppDocument(link: string, filename: string, caption?: string) {
    await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${EVOLUTION_INSTANCE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
        body: JSON.stringify({ number: remote_jid, mediatype: "document", media: link, fileName: filename, caption: caption || undefined })
    });
  }

  // 1. Ticks azuis (Evolution nao tem "digitando..." tao direto quanto a Meta tinha)
  await markReadWithTyping(EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE, remote_jid, message_id);
  await sendWhatsAppMessage("⏳ *Analisando seu biótipo e criando sua dieta e treino...* (Isso pode levar alguns segundos).");

  // 2. Pegar User ID (usa o do flow se disponivel, senao busca por telefone)
  let profile: any = null;
  if (user_id) {
      const { data } = await supabase
          .from("profiles")
          .select("id, full_name, goal")
          .eq("id", user_id)
          .maybeSingle();
      profile = data || { id: user_id };
  } else {
      const phoneCandidates = generatePhoneCandidates(sender_number);
      for (const candidate of phoneCandidates) {
          const { data } = await supabase
              .from("profiles")
              .select("id, full_name, goal")
              .eq("phone", candidate)
              .maybeSingle();

          if (data) {
              profile = data;
              break;
          }
      }
  }

  if (!profile) {
      await sendWhatsAppMessage("⚠️ Conta não encontrada. Por favor, registre-se no site primeiro.");
      return { error: "User not found" };
  }

  // 2.1 Checar Paywall - assinatura ativa E dentro do periodo pago (valid_until).
  // Esse script nunca checou assinatura antes - qualquer cadastrado tinha acesso gratis ao Coach.
  const { data: entitlement, error: entError } = await supabase.rpc('get_active_entitlement', { p_user_id: profile.id });
  if (entError) {
      console.error("Erro ao checar entitlement:", entError);
  }
  const isActive = !!(entitlement && entitlement.length > 0);

  if (!isActive) {
      await supabase.from("whatsapp_sessions").update({ state: "IDLE" }).eq("phone_number", sender_number);
      await sendWhatsAppMessage("🚨 *Assinatura Inativa!*\n\nPara eu criar sua dieta e treino, você precisa estar no plano Renascer Completo (já inclui o Viora).\n\n👉 Assine aqui:\nhttps://www.jeanspagolla.com.br/checkout?plan=completo");
      return { success: false, error: "Subscription inactive" };
  }

  // A partir daqui, qualquer falha (download da midia, OpenAI, parsing) cai no catch abaixo,
  // que avisa o usuario em vez de deixa-lo so com o "Analisando..." pra sempre.
  try {
    // 3. Baixar imagem via Evolution API (media_id aqui e o message_id, nao
    // um ID de midia separado como a Meta tinha)
    const base64Img = await getMediaBase64(
      EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE,
      { remoteJid: remote_jid, id: media_id, fromMe: false }
    );
    if (!base64Img) {
        throw new Error("Falha ao obter a imagem da Evolution API.");
    }
    const mimeType = "image/jpeg";

    // 3.1 Limite Diário de Avaliação Física (2 por dia, horário de Brasília)
    const COACH_DAILY_LIMIT = 2;
    const nowB = new Date();
    const startTodayBR = new Date(nowB.getTime() - 3 * 60 * 60 * 1000);
    startTodayBR.setUTCHours(3, 0, 0, 0);
    const { count: coachToday } = await supabase
        .from("coach_assessments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .gte("created_at", startTodayBR.toISOString());

    if (coachToday !== null && coachToday >= COACH_DAILY_LIMIT) {
        await supabase.from("whatsapp_sessions").update({ state: "IDLE" }).eq("phone_number", sender_number);
        await sendWhatsAppMessage(`🚨 *Limite de Avaliação!*\n\nVocê já gerou as suas *${COACH_DAILY_LIMIT} avaliações físicas de hoje*. O limite existe para você ter tempo de aplicar o plano. Volte amanhã! 💪`);
        return { success: false, reason: "coach_daily_limit" };
    }

    // 3.2 Buscar avaliação anterior para comparação de evolução
    const { data: previousAssessment } = await supabase
        .from("coach_assessments")
        .select("created_at, ai_structured")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    let lastEvaluationText = "";
    const prevAnalysis = previousAssessment?.ai_structured?.analysis;
    if (prevAnalysis) {
        const prevDate = new Date(previousAssessment.created_at).toLocaleDateString("pt-BR");
        lastEvaluationText = `Avaliação Anterior (${prevDate}): `;
        if (prevAnalysis.body_fat_percentage) lastEvaluationText += `Percentual de Gordura Estimado: ${prevAnalysis.body_fat_percentage}%. `;
        if (prevAnalysis.somatotype) lastEvaluationText += `Biótipo: ${prevAnalysis.somatotype}. `;
        if (prevAnalysis.muscle_mass_level) lastEvaluationText += `Massa Muscular: ${prevAnalysis.muscle_mass_level}. `;
        if (prevAnalysis.strengths?.length) lastEvaluationText += `Pontos Fortes: ${prevAnalysis.strengths.join(", ")}. `;
        if (prevAnalysis.weaknesses?.length) lastEvaluationText += `Pontos Fracos: ${prevAnalysis.weaknesses.join(", ")}. `;
        lastEvaluationText += `\nCompare o físico atual com esse histórico e preencha "evolution_notes" com as mudanças reais notadas (gordura, massa muscular, postura).`;
    }

    // 4. Analisar com OpenAI
    // Meta do usuário (emagrecer | ganhar_massa | manter) ancora o foco do protocolo
    const GOAL_PROMPTS: Record<string, string> = {
        emagrecer: 'A META PRINCIPAL do usuário é EMAGRECER (perda de gordura). A dieta DEVE ficar em déficit calórico moderado e o "focus" do treino deve priorizar perda de gordura (sem abandonar musculação).',
        ganhar_massa: 'A META PRINCIPAL do usuário é GANHAR MASSA MUSCULAR (hipertrofia). A dieta DEVE ficar em superávit calórico limpo com proteína alta e o "focus" do treino deve ser hipertrofia.',
        manter: 'A META PRINCIPAL do usuário é COMER MELHOR / MANTER (recomposição e saúde). A dieta DEVE ficar próxima da manutenção calórica com foco em qualidade nutricional, e o treino equilibrado entre força e condicionamento.'
    };
    const goalInstruction = profile.goal && GOAL_PROMPTS[profile.goal]
        ? `\n\nMETA DO USUÁRIO (obrigatório respeitar): ${GOAL_PROMPTS[profile.goal]}\nA análise da foto refina o plano (biótipo, pontos fracos), mas NÃO substitui a meta declarada.`
        : "";

    const promptSystem = `Você é o "Titan Coach", um treinador olímpico de elite e nutricionista esportivo PhD.
Sua missão é analisar a foto do físico de um usuário e criar um **Protocolo de Transformação** completo, rico e detalhado.${goalInstruction}

Se a foto enviada NÃO contiver um corpo humano nítido ou se for impossível analisar o biótipo, defina "valid_body" como false.

RETORNE APENAS JSON.
NÃO use Markdown.
Formato de Resposta (Siga estritamente esta estrutura):
{
  "valid_body": true,
  "analysis": {
    "body_fat_percentage": 15,
    "somatotype": "Ectomorfo" | "Mesomorfo" | "Endomorfo",
    "muscle_mass_level": "Baixo" | "Médio" | "Alto",
    "posture_analysis": "Análise detalhada da postura estruturada em tópicos (usando hifens '-'), apontando desvios específicos (ex: ombros projetados, leve cifose) de forma legível e sem parágrafos densos.",
    "evolution_notes": "Se uma 'Avaliação Anterior' for fornecida no contexto, compare o físico atual com ela e descreva as mudanças reais notadas (gordura, massa muscular, postura) de forma técnica e motivacional, estruturada em tópicos (usando hifens '-'). Se NÃO houver avaliação anterior, dê dicas práticas de como acompanhar a evolução até a próxima avaliação, estruturadas em tópicos (usando hifens '-').",
    "evolution_highlights": ["3 a 4 bullets MUITO curtos (máximo 8 palavras cada) resumindo o essencial do evolution_notes. Ex: 'Redução visível de gordura abdominal', 'Postura: priorizar mobilidade torácica'. Sempre preencher."]
,
    "strengths": ["Ombros largos", "Cintura fina"],
    "weaknesses": ["Panturrilhas pouco desenvolvidas"]
  },
  "diet": {
    "total_calories": 2400,
    "macros": {
      "protein_g": 160,
      "carbs_g": 280,
      "fats_g": 70
    },
    "hydration_liters": 3.5,
    "supplements": [
       { "name": "Creatina", "dosage": "5g pós-treino", "reason": "Aumento de força e recuperação" },
       { "name": "Whey Protein", "dosage": "30g se necessário", "reason": "Praticidade proteica" }
    ],
    "meal_plan_example": [
      {
        "name": "Café da Manhã",
        "time_range": "07:00 - 08:00",
        "options": [
             "Opção 1: 3 Ovos mexidos + 1 Banana + 40g Aveia",
             "Opção 2: 2 Fatias Pão Integral + 100g Frango Desfiado + Cottage"
        ],
        "substitution_suggestion": "Substituir ovos por Whey se estiver com pressa."
      },
      {
        "name": "Almoço",
        "time_range": "12:00 - 13:00",
        "options": [
             "Opção 1: 150g Frango Grelhado + 120g Arroz Branco + Salada à vontade",
             "Opção 2: 150g Patinho Moído + 150g Batata Inglesa"
        ],
        "substitution_suggestion": "Trocar arroz por Macarrão Integral na mesma proporção."
      }
    ]
  },
  "workout": {
    "split": "ABCD",
    "focus": "Hipertrofia" | "Força" | "Perda de Gordura",
    "frequency_days": 4,
    "injury_adaptations": {
       "knee_pain": "Substituir Agachamento por Leg Press",
       "shoulder_pain": "Preferir halteres na pegada neutra"
    },
    "routine": [
      {
        "day": "Segunda-feira",
        "muscle_group": "Peito + Tríceps",
        "exercises": [
           { "name": "Supino Inclinado com Halteres", "sets": 4, "reps": "8-12", "technique": "Descida controlada" },
           { "name": "Crucifixo Máquina", "sets": 3, "reps": "12-15", "technique": "Pico de contração de 1s" }
        ]
      },
      {
        "day": "Terça-feira",
        "muscle_group": "Costas + Bíceps",
        "exercises": [
           { "name": "Puxada Alta", "sets": 4, "reps": "10-12", "technique": "Cotovelos para baixo" }
        ]
      }
    ]
  },
  "motivation_quote": "Uma frase de impacto do treinador."
}

Regras IMPORTANTES:
1. Seja MUITO DETALHADO na dieta. Dê SEMPRE pelo menos 2 opções para CADA refeição ("options").
2. Inclua o horário sugerido ("time_range") para cada refeição.
3. O campo "substitution_suggestion" deve dar uma alternativa clara de troca de alimentos.
4. Forneça um treino completo estruturado para os dias da semana em "routine".
5. Nos suplementos, especifique COMO tomar e PORQUE — mas de forma COMPACTA (dosage curto, reason em 1 frase).
6. O campo "technique" de cada exercício deve ser uma dica CURTA (máximo 6 palavras, ex: "Descida controlada 2s"). Se não houver dica relevante, omita o campo.
7. Escreva TUDO em português do Brasil, usando apenas o alfabeto latino.
8. Se a imagem não for um corpo analisável, retorne "valid_body": false.
9. Se a mensagem do usuário incluir uma "Avaliação Anterior", USE esses dados para preencher "evolution_notes" com uma comparação real de progresso (não invente dados que não foram fornecidos).`;

    const openaiUrl = "https://api.openai.com/v1/chat/completions";

    const userContent: any[] = [];
    if (lastEvaluationText) {
        userContent.push({ type: "text", text: lastEvaluationText });
    }
    userContent.push({
        type: "image_url",
        image_url: {
            url: `data:${mimeType};base64,${base64Img}`,
            detail: "high"
        }
    });

    const aiResponse = await fetch(openaiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-5.4-mini",
            messages: [
                {
                    role: "system",
                    content: promptSystem
                },
                {
                    role: "user",
                    content: userContent
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2
        })
    });

    if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error("OpenAI API Error:", aiResponse.status, errText);
        throw new Error(`Erro na IA (${aiResponse.status})`);
    }

    const aiDataRaw = await aiResponse.json();
    let responseText = aiDataRaw.choices?.[0]?.message?.content;

    if (!responseText) throw new Error("Sem resposta válida da OpenAI.");

    const aiData = JSON.parse(responseText);

    if (!aiData.valid_body) {
        await supabase
            .from("whatsapp_sessions")
            .update({ state: "IDLE" })
            .eq("phone_number", sender_number);

        await sendWhatsAppMessage("⚠️ Não consegui ver seu corpo claramente na foto. O processo de dieta foi cancelado. Você pode enviar a foto do seu prato de comida ou chamar o menu novamente!");
        return { success: false, reason: "invalid_body" };
    }

    // 4.1 Salvar a foto no bucket coach-uploads (timeline de evolução)
    let imagePath: string | null = null;
    try {
        const ext = mimeType.includes("png") ? "png" : "jpg";
        const candidatePath = `${profile.id}/coach_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("coach-uploads").upload(candidatePath, Buffer.from(base64Img, 'base64'), {
            contentType: mimeType,
            upsert: true
        });
        if (uploadError) throw uploadError;
        imagePath = candidatePath;
    } catch (uploadErr) {
        console.error("Erro ao salvar foto da avaliação:", uploadErr);
        imagePath = null;
    }

    // 5. Salvar no Supabase
    const { data: dbInsert } = await supabase
        .from("coach_assessments")
        .insert({
            user_id: profile.id,
            source: "whatsapp",
            biotype: aiData.analysis?.somatotype || null,
            estimated_body_fat: aiData.analysis?.body_fat_percentage || 0,
            muscle_mass_level: aiData.analysis?.muscle_mass_level || null,
            goal_suggestion: aiData.workout?.focus || null,
            workout_plan: typeof aiData.workout === 'string' ? aiData.workout : JSON.stringify(aiData.workout),
            diet_plan: typeof aiData.diet === 'string' ? aiData.diet : JSON.stringify(aiData.diet),
            ai_raw_response: responseText,
            ai_structured: aiData,
            image_url: imagePath
        })
        .select("id")
        .single();

    // 5.05 Card visual de resumo (PNG, mesma infra do card de comida) — vai
    // ANTES do PDF: a legenda dele aponta "PDF abaixo". Se falhar, o texto de
    // fallback no passo 7 cobre.
    let cardSent = false;
    try {
        const firstName = (profile.full_name || "").trim().split(/\s+/)[0] || "";
        const cardHtml = buildCoachCardHtml(aiData, firstName);
        const cardRes = await fetch("https://puppeteer.jeanspagolla.com.br/api/render", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ html: cardHtml, width: 1080, height: 400 })
        });

        if (cardRes.ok) {
            const cardBuffer = Buffer.from(await cardRes.arrayBuffer());
            const cardPath = `${profile.id}/coach_card_${Date.now()}.png`;
            const { error: cardUpErr } = await supabase.storage.from("consultas").upload(cardPath, cardBuffer, { contentType: "image/png", upsert: true });
            if (!cardUpErr) {
                const { data: cardUrl } = supabase.storage.from("consultas").getPublicUrl(cardPath);
                if (cardUrl?.publicUrl) {
                    await sendWhatsAppImage(cardUrl.publicUrl, "✅ *Sua Avaliação Física está pronta!*\n\nSeu plano completo de *treino e dieta* está no PDF logo abaixo 👇");
                    cardSent = true;
                }
            }
        } else {
            console.error("Erro na renderização do card da avaliação:", cardRes.status);
        }
    } catch (cardErr) {
        console.error("Erro no card da avaliação:", cardErr);
    }

    // 5.1 Geração do PDF profissional (puppeteer próprio — mesma infra do card
    // de comida; substituiu a rota n8n pdf-coach -> Gotenberg em 2026-07-15)
    try {
        const pdfFileName = `Viora_Titan_${Date.now()}`;
        const pdfHtml = buildCoachPdfHtml(aiData);

        const pdfResponse = await fetch("https://puppeteer.jeanspagolla.com.br/api/render-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ html: pdfHtml })
        });

        if (pdfResponse.ok) {
            const pdfBlob = await pdfResponse.arrayBuffer();
            const storagePath = `${profile.id}/${pdfFileName}.pdf`;
            await supabase.storage.from("coach-pdfs").upload(storagePath, new Uint8Array(pdfBlob), { contentType: "application/pdf" });

            const { data: urlData } = await supabase.storage.from("coach-pdfs").createSignedUrl(storagePath, 3600);

            if (urlData?.signedUrl) {
                await sendWhatsAppDocument(urlData.signedUrl, `${pdfFileName}.pdf`, "📋 Protocolo Titan — seu Treino e Dieta completos (2 páginas)");
            }
        }
    } catch (pdfErr) {
        console.error("Erro na geração do PDF:", pdfErr);
    }

    // 6. Voltar o estado para IDLE
    await supabase
        .from("whatsapp_sessions")
        .update({ state: "IDLE" })
        .eq("phone_number", sender_number);

    // 7. Fallback em texto — só se o card visual não saiu (o card + caption já
    // cobrem o resumo; textão duplicado era redundante com o PDF)
    if (!cardSent) {
        let successText = `✅ *Sua Avaliação Física está pronta!*\n\n🧬 *Biótipo:* ${aiData.analysis?.somatotype || ""}\n⚖️ *Gordura Estimada:* ~${aiData.analysis?.body_fat_percentage || ""}%\n💪 *Massa Muscular:* ${aiData.analysis?.muscle_mass_level || ""}\n\n🎯 *Foco:* ${aiData.workout?.focus || ""}`;
        if (aiData.analysis?.evolution_notes) {
            successText += `\n\n📈 *EVOLUÇÃO*\n${aiData.analysis.evolution_notes}`;
        }
        successText += `\n\nSeu plano completo de Dieta e Treino está no PDF acima e no seu painel:\n👉 https://app.jeanspagolla.com.br/dashboard`;
        await sendWhatsAppMessage(successText);
    }

    return { success: true, biotype: aiData.analysis?.somatotype || "" };

  } catch (error: any) {
      console.error("Erro ao processar avaliação física:", error);
      await supabase.from("whatsapp_sessions").update({ state: "IDLE" }).eq("phone_number", sender_number);
      // Sem isso, o usuario ficava so com o "Analisando..." pra sempre, achando que o bot travou.
      try {
          await sendWhatsAppMessage("⚠️ Tive um problema para gerar sua avaliação agora. Pode tentar de novo em alguns instantes?");
      } catch (notifyErr) {
          console.error("Falha ao avisar usuario sobre o erro:", notifyErr);
      }
      return { success: false, error: error.message };
  }
}
