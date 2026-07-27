/**
 * Lib compartilhada do fluxo WhatsApp do Viora.
 * Importar via: import { generatePhoneCandidates, sendWhatsAppMessage } from "/u/admin/lib_whatsapp";
 */

/**
 * Formato canônico de profiles.phone: BR = "55" + DDD + celular com 9º dígito
 * (13 dígitos); internacional = só os dígitos. O wa_id da Meta chega SEM o 9º
 * dígito pra números BR antigos — gravar o wa_id cru cria conta duplicada de
 * quem se cadastrou pelo site com o 9. Espelhada em src/lib/phone.ts (site) e
 * public.normalize_phone_br (trigger no banco) — mudou aqui, muda lá.
 */
export function normalizePhoneBR(raw: string): string {
  const d = (raw || "").replace(/\D/g, "");
  const withNinthDigit = (ddd: string, rest: string) =>
    rest.length === 8 && /^[6-9]/.test(rest) ? `55${ddd}9${rest}` : `55${ddd}${rest}`;
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) {
    return withNinthDigit(d.slice(2, 4), d.slice(4));
  }
  if (d.length === 11 && d[2] === "9") return `55${d}`;
  if (d.length === 10) return withNinthDigit(d.slice(0, 2), d.slice(2));
  return d;
}

// ── Telemetria de custo de IA → painel Saas Master ──────────────────────────
// Insere direto na tabela ai_usage_logs do Supabase do PAINEL (não do Viora)
// via REST. Vars no Windmill: SAASMASTER_SUPABASE_URL + SAASMASTER_SERVICE_KEY.
// Sempre chamar dentro de try/catch no script — telemetria nunca pode derrubar
// a resposta ao usuário.

const SAASMASTER_FOODSNAP_PROJECT_ID = "1d0590b9-6fe3-4793-a9b7-ef5ea29f4b23";

// USD por 1M de tokens (entrada/saída). Modelo fora da tabela = custo 0 com
// flag price_unknown no metadata (tokens ficam registrados mesmo assim).
const OPENAI_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-5.4-mini": { input: 0.75, output: 4.5 },
};

export async function reportAiUsage(
  saasmasterUrl: string,
  saasmasterServiceKey: string,
  model: string,
  usage: { prompt_tokens?: number; completion_tokens?: number } | null | undefined,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const tokensIn = usage?.prompt_tokens ?? 0;
  const tokensOut = usage?.completion_tokens ?? 0;
  const price = OPENAI_PRICING[model];
  const costUsd = price
    ? (tokensIn * price.input + tokensOut * price.output) / 1_000_000
    : 0;

  await fetch(`${saasmasterUrl.replace(/\/$/, "")}/rest/v1/ai_usage_logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: saasmasterServiceKey,
      Authorization: `Bearer ${saasmasterServiceKey}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      project_id: SAASMASTER_FOODSNAP_PROJECT_ID,
      provider: "openai",
      model,
      tokens_input: tokensIn,
      tokens_output: tokensOut,
      units: 1,
      cost_usd: Number(costUsd.toFixed(6)),
      metadata: { ...(metadata ?? {}), ...(price ? {} : { price_unknown: true }) },
    }),
  });
}

export function generatePhoneCandidates(raw: string): string[] {
  if (!raw) return [];
  const candidates: string[] = [];
  const num = raw.replace(/\D/g, "");
  if (!num) return candidates;

  candidates.push(num);

  const withoutDDI = num.startsWith("55") ? num.slice(2) : num;
  if (withoutDDI !== num) candidates.push(withoutDDI);
  if (!num.startsWith("55")) candidates.push("55" + num);

  const ddd = withoutDDI.slice(0, 2);
  const rest = withoutDDI.slice(2);

  // Adiciona 9º dígito se tem 8 dígitos após DDD
  if (rest.length === 8) {
      const with9 = ddd + "9" + rest;
      candidates.push(with9);
      candidates.push("55" + with9);
  }

  // Remove 9º dígito se tem 9 dígitos após DDD
  if (rest.length === 9 && rest.startsWith("9")) {
      const without9 = ddd + rest.slice(1);
      candidates.push(without9);
      candidates.push("55" + without9);
  }

  return [...new Set(candidates)];
}

/**
 * Envia mensagem via Graph API do WhatsApp, com 1 retry em caso de erro transitorio
 * (429 rate limit ou 5xx). Nao lanca excecao em falha - retorna a Response pro chamador decidir.
 */
export async function sendWhatsAppMessage(
  metaToken: string,
  phoneNumberId: string,
  payload: Record<string, any>,
  retries: number = 1
): Promise<Response> {
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  let lastRes: Response;

  for (let attempt = 0; attempt <= retries; attempt++) {
    lastRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${metaToken}` },
      body: JSON.stringify(payload)
    });

    if (lastRes.ok) return lastRes;

    // So vale retry em erro transitorio (rate limit ou erro de servidor)
    const isTransient = lastRes.status === 429 || lastRes.status >= 500;
    if (!isTransient || attempt === retries) break;

    await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }

  console.error("Falha ao enviar mensagem WhatsApp:", lastRes!.status, await lastRes!.text());
  return lastRes!;
}

/**
 * Marca a mensagem recebida como lida (ticks azuis) e liga o indicador
 * "digitando..." — o indicador some sozinho quando a proxima mensagem for
 * enviada (ou apos ~25s). Falha aqui nunca deve quebrar o fluxo.
 */
export async function markReadWithTyping(
  metaToken: string,
  phoneNumberId: string,
  messageId: string
): Promise<void> {
  if (!messageId) return;
  try {
    await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${metaToken}` },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
        typing_indicator: { type: "text" }
      })
    });
  } catch (e) {
    console.error("markReadWithTyping falhou (ignorado):", e);
  }
}

// Windmill exige um export main() para o script ser um runnable valido.
// Esta lib nao deve ser executada diretamente, so importada por outros scripts.
export async function main() {
  return { ok: true, note: "lib_whatsapp e uma biblioteca compartilhada, importe as funcoes em vez de rodar direto" };
}
