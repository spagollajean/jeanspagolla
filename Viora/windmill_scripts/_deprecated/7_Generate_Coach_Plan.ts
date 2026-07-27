import * as wmill from "windmill-client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

/**
 * Windmill Script 7: Generate Coach Plan
 *
 * Executa a IA pesada do Titan Coach, gera o PDF via n8n e entrega no WhatsApp.
 * Também compara com a avaliação anterior do usuário (evolução) e salva a foto
 * para a timeline de evolução no dashboard.
 */

const COACH_SYSTEM_PROMPT = `
Você é o "Titan Coach", um treinador olímpico de elite e nutricionista esportivo PhD.
Sua missão é analisar o físico de um usuário através de uma foto e criar um **Protocolo de Transformação** completo, rico e detalhado.

RETORNE APENAS JSON.
NÃO use Markdown.
Formato de Resposta (Siga estritamente esta estrutura):

{
  "analysis": {
    "body_fat_percentage": 0,
    "somatotype": "Ectomorfo" | "Mesomorfo" | "Endomorfo",
    "muscle_mass_level": "Baixo" | "Médio" | "Alto",
    "posture_analysis": "Texto detalhado sobre postura (ex: leve cifose, lordose, desvios laterais)",
    "evolution_notes": "Comparação detalhada e motivacional com a avaliação anterior (se enviada) ou dicas para acompanhar o progresso se for a primeira vez.",
    "strengths": ["Ombros largos", "Cintura fina", "Bons quadríceps"],
    "weaknesses": ["Panturrilhas pouco desenvolvidas", "Peitoral superior fraco"]
  },
  "diet": {
    "total_calories": 0,
    "macros": { "protein_g": 0, "carbs_g": 0, "fats_g": 0 },
    "hydration_liters": 0,
    "supplements": [
       { "name": "Creatina", "dosage": "5g pós-treino", "reason": "Aumento de força e recuperação" },
       { "name": "Whey Protein", "dosage": "30g se não bater a meta", "reason": "Praticidade para bater proteínas" },
       { "name": "Multivitamínico", "dosage": "1 caps almoço", "reason": "Micro-nutrientes essenciais" }
    ],
    "meal_plan_example": [
      {
        "name": "Café da Manhã",
        "time_range": "07:00 - 08:00",
        "options": [
             "Opção 1: 3 Ovos mexidos + 1 Banana + 40g Aveia",
             "Opção 2: 2 Fatias Pão Integral + 100g Frango Desfiado + Queijo Cottage"
        ],
        "substitution_suggestion": "Para vegetarianos: Trocar frango por Tofu ou ovos por Shake proteico vegano."
      },
      {
        "name": "Almoço",
        "time_range": "12:00 - 13:00",
        "options": [
             "Opção 1: 150g Frango Grelhado + 120g Arroz Branco + Vegetais Verdes à vontade",
             "Opção 2: 150g Patinho Moído + 150g Batata Inglesa + Salada Mista"
        ],
        "substitution_suggestion": "Se enjoar de arroz, use Macarrão Integral (mesmo peso) ou Batata Doce (peso x1.3)."
      },
      {
        "name": "Lanche da Tarde",
        "time_range": "16:00 - 16:30",
        "options": [
             "Opção 1: 1 Iogurte Grego Zero + 20g Nozes",
             "Opção 2: 1 Fruta + 1 Dose de Whey"
        ],
        "substitution_suggestion": "Pode trocar as gorduras (nozes) por Pasta de Amendoim."
      },
       {
        "name": "Jantar",
        "time_range": "20:00 - 21:00",
        "options": [
             "Opção 1: 150g Peixe Branco (Tilápia) + Salada Completa + Azeite de Oliva",
             "Opção 2: Omelete de 3 Ovos com Espinafre e Tomate"
        ],
        "substitution_suggestion": "Evite carboidratos pesados a noite se o objetivo for secar."
      }
    ]
  },
  "workout": {
    "split": "ABC" | "ABCD" | "ABCDE" | "Fullbody",
    "focus": "Hipertrofia" | "Força" | "Perda de Gordura",
    "frequency_days": 0,
    "injury_adaptations": {
       "knee_pain": "Substituir Agachamento por Leg Press 45 com pés altos",
       "shoulder_pain": "Fazer Supino com Halteres pegada neutra ao invés de barra",
       "back_pain": "Evitar Terra e Remada Curvada, preferir máquinas apoiadas"
    },
    "routine": [
      {
        "day": "Segunda",
        "muscle_group": "Peito + Tríceps",
        "exercises": [
           { "name": "Supino Inclinado com Halteres", "sets": 4, "reps": "8-12", "technique": "Focar na parte superior, descida controlada" },
           { "name": "Crucifixo Máquina", "sets": 3, "reps": "12-15", "technique": "Pico de contração de 1s" }
        ]
      }
    ]
  },
  "motivation_quote": "Uma frase curta de impacto."
}

Regras IMPORTANTES:
1. Seja MUITO DETALHADO na dieta. Dê SEMPRE pelo menos 2 opções para CADA refeição ("options").
2. Inclua o horário sugerido ("time_range") para cada refeição.
3. O campo "substitution_suggestion" deve dar uma alternativa clara de troca de alimentos (ex: trocar carbo X por Y).
4. Adapte o treino ao biotipo (ex: Ectomorfo menos volume, Endomorfo mais cardio).
5. Nos suplementos, especifique COMO tomar e PORQUE.
6. A resposta DEVE ser um JSON válido.
7. Se um histórico (Avaliação Anterior) for fornecido, compare o físico atual com os dados anteriores e preencha "evolution_notes" com um parecer técnico e motivacional sobre as mudanças reais notadas (gordura, massa muscular, postura). Estime o aumento/redução de %gordura com base no julgamento visual crítico de um especialista. Se não houver histórico, use "evolution_notes" para dar dicas de como acompanhar a evolução na próxima avaliação.
`;

function buildCoachPdfHtml(plan: any): string {
  // Código simplificado para caber no arquivo único, você pode colar seu template.ts original aqui.
  return `<html><body><h1>Protocolo Titan</h1><p>Biótipo: ${plan.analysis?.somatotype}</p></body></html>`;
}

export async function main(
  remote_jid: string,
  interactive_id: string,
  text_message: string,
  user_id: string,
  sender_number: string,
  conversation_id: string,
  temp_data: any
) {
  const META_ACCESS_TOKEN = await wmill.getVariable("u/bevervansomarcio/META_ACCESS_TOKEN") as string;
  const META_PHONE_NUMBER_ID = await wmill.getVariable("u/bevervansomarcio/META_PHONE_NUMBER_ID") as string;
  const SUPABASE_URL = await wmill.getVariable("u/bevervansomarcio/SUPABASE_URL") as string;
  const SUPABASE_SERVICE_ROLE_KEY = await wmill.getVariable("u/bevervansomarcio/SUPABASE_SERVICE_ROLE_KEY") as string;
  const GEMINI_API_KEY = await wmill.getVariable("u/bevervansomarcio/GEMINI_API_KEY") as string;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const GRAPH_API_URL = "https://graph.facebook.com/v19.0";

  async function sendWhatsAppMessage(text: string) {
      await fetch(`${GRAPH_API_URL}/${META_PHONE_NUMBER_ID}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${META_ACCESS_TOKEN}` },
          body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: remote_jid, type: "text", text: { body: text }})
      });
  }

  // 1. DEFINIR OBJETIVO
  let goal = "Hipertrofia";
  if (interactive_id === "goal_emagrecer") goal = "Emagrecimento";
  else if (interactive_id === "goal_definicao") goal = "Definição";

  await sendWhatsAppMessage("🤖 Analisando seu físico e processando a estratégia nutricional...\n(Isso leva uns 10 segundos).");

  // 2. RECUPERAR IMAGEM DO STORAGE
  const { data: blob } = await supabase.storage.from("coach-uploads").download(temp_data.front_image);
  let base64 = "";
  if (blob) {
      const buffer = await blob.arrayBuffer();
      base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

  // 3. BUSCAR AVALIAÇÃO ANTERIOR PARA COMPARAÇÃO DE EVOLUÇÃO
  const { data: previousAssessment } = await supabase
      .from("coach_assessments")
      .select("created_at, ai_structured")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  const parts: any[] = [
      { text: COACH_SYSTEM_PROMPT },
      { text: `Objetivo: ${goal}` },
  ];

  const prevAnalysis = previousAssessment?.ai_structured?.analysis;
  if (prevAnalysis) {
      const prevDate = new Date(previousAssessment.created_at).toLocaleDateString("pt-BR");
      let lastEvaluation = `Avaliação Anterior (${prevDate}): `;
      if (prevAnalysis.body_fat_percentage) lastEvaluation += `Percentual de Gordura Estimado: ${prevAnalysis.body_fat_percentage}%. `;
      if (prevAnalysis.somatotype) lastEvaluation += `Biótipo: ${prevAnalysis.somatotype}. `;
      if (prevAnalysis.muscle_mass_level) lastEvaluation += `Massa Muscular: ${prevAnalysis.muscle_mass_level}. `;
      if (prevAnalysis.strengths?.length) lastEvaluation += `Pontos Fortes: ${prevAnalysis.strengths.join(", ")}. `;
      if (prevAnalysis.weaknesses?.length) lastEvaluation += `Pontos Fracos: ${prevAnalysis.weaknesses.join(", ")}. `;

      parts.push({ text: `${lastEvaluation}\nCompare o físico atual com esse histórico e preencha "evolution_notes" com as mudanças notadas.` });
  }

  parts.push({ inlineData: { mimeType: "image/jpeg", data: base64 } });

  // 4. CHAMAR GEMINI
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
  });

  const responseText = result.response.text();
  const plan = JSON.parse(responseText);

  // 5. MENSAGEM LUXO (WHATSAPP)
  const lines: string[] = [];
  lines.push("📱 *SEU PROTOCOLO TITAN*");
  lines.push("");
  lines.push(`🧬 *BIÓTIPO*: ${plan.analysis?.somatotype}`);
  lines.push(`🎯 *FOCO*: ${plan.workout?.focus}`);
  if (plan.analysis?.evolution_notes) {
      lines.push("");
      lines.push(`📈 *EVOLUÇÃO*: ${plan.analysis.evolution_notes}`);
  }
  lines.push("");
  lines.push("🏋️ *TREINO*");
  lines.push(`▪ Divisão ${plan.workout?.split} (${plan.workout?.frequency_days}x/semana)`);
  lines.push("");
  lines.push("🥗 *DIETA*");
  lines.push(`▪ ${plan.diet?.total_calories} kcal (P: ${plan.diet?.macros?.protein_g}g)`);
  lines.push("");
  lines.push(`💡 _DICA:_ ${plan.motivation_quote}`);
  lines.push("");
  lines.push("📲 _Acesse o app para ver o plano completo, suas fotos e sua evolução!_");

  await sendWhatsAppMessage(lines.join('\n'));

  // 6. GERAÇÃO DO PDF (Gotenberg/n8n)
  try {
      const pdfFileName = `FoodSnap_Titan_${Date.now()}`;
      const pdfHtml = buildCoachPdfHtml(plan); // Em produção, usar seu template original aqui

      // Chamada para sua edge/webhook do N8N
      const pdfResponse = await fetch("https://n8n.seureview.com.br/webhook/pdf-coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html: pdfHtml, file_name: pdfFileName })
      });

      if (pdfResponse.ok) {
          const pdfBlob = await pdfResponse.arrayBuffer();
          const storagePath = `${user_id}/${pdfFileName}.pdf`;
          await supabase.storage.from("coach-pdfs").upload(storagePath, new Uint8Array(pdfBlob), { contentType: "application/pdf" });

          const { data: urlData } = await supabase.storage.from("coach-pdfs").createSignedUrl(storagePath, 3600);

          if (urlData?.signedUrl) {
              await fetch(`${GRAPH_API_URL}/${META_PHONE_NUMBER_ID}/messages`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${META_ACCESS_TOKEN}` },
                  body: JSON.stringify({
                      messaging_product: "whatsapp", recipient_type: "individual", to: remote_jid,
                      type: "document", document: { link: urlData.signedUrl, filename: `${pdfFileName}.pdf`, caption: "📄 Seu Protocolo Titan em PDF!" }
                  })
              });
          }
      }
  } catch(e) { console.error("PDF Error", e); }

  // 7. SALVAR NO DB E RESETAR STATE
  await supabase.from("coach_assessments").insert({
      user_id: user_id,
      source: "whatsapp",
      goal_suggestion: goal,
      biotype: plan.analysis?.somatotype || null,
      estimated_body_fat: parseFloat(String(plan.analysis?.body_fat_percentage || 0)) || 0,
      muscle_mass_level: plan.analysis?.muscle_mass_level || null,
      workout_plan: typeof plan.workout === 'string' ? plan.workout : JSON.stringify(plan.workout),
      diet_plan: typeof plan.diet === 'string' ? plan.diet : JSON.stringify(plan.diet),
      ai_raw_response: responseText,
      ai_structured: plan,
      image_url: temp_data.front_image || null,
      images: { front: temp_data.front_image || null }
  });

  await supabase.from("whatsapp_sessions").update({ state: "IDLE", temp_data: {} }).eq("phone_number", sender_number);

  return { success: true };
}
