/**
 * Lib compartilhada do fluxo WhatsApp do Viora.
 * Importar via: import { generatePhoneCandidates, sendWhatsAppMessage } from "/u/admin/lib_whatsapp";
 *
 * Migrado de Meta Cloud API pra Evolution API (self-hosted, conecta via
 * QR code no WhatsApp normal do Jean -- nao precisa de aprovacao/verificacao
 * de negocio da Meta).
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
 * Envia mensagem de texto via Evolution API, com 1 retry em caso de erro
 * transitorio (429 rate limit ou 5xx). Nao lanca excecao em falha - retorna
 * a Response pro chamador decidir.
 *
 * `phoneNumberId` foi mantido no nome do parametro por compatibilidade com
 * quem ja chama essa funcao, mas na Evolution isso e o numero de destino
 * (sender_number), nao um Phone Number ID da Meta.
 */
export async function sendWhatsAppMessage(
  evolutionApiUrl: string,
  evolutionApiKey: string,
  evolutionInstance: string,
  toNumber: string,
  text: string,
  retries: number = 1
): Promise<Response> {
  const url = `${evolutionApiUrl}/message/sendText/${evolutionInstance}`;
  let lastRes: Response;

  for (let attempt = 0; attempt <= retries; attempt++) {
    lastRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evolutionApiKey },
      body: JSON.stringify({ number: toNumber, text })
    });

    if (lastRes.ok) return lastRes;

    const isTransient = lastRes.status === 429 || lastRes.status >= 500;
    if (!isTransient || attempt === retries) break;

    await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }

  console.error("Falha ao enviar mensagem WhatsApp (Evolution):", lastRes!.status, await lastRes!.text());
  return lastRes!;
}

/**
 * Marca a mensagem recebida como lida (ticks azuis). Evolution nao tem um
 * indicador de "digitando" tao direto quanto a Meta Cloud API tinha -- so a
 * leitura mesmo. Falha aqui nunca deve quebrar o fluxo.
 */
export async function markReadWithTyping(
  evolutionApiUrl: string,
  evolutionApiKey: string,
  evolutionInstance: string,
  remoteJid: string,
  messageId: string
): Promise<void> {
  if (!messageId) return;
  try {
    await fetch(`${evolutionApiUrl}/chat/markMessageAsRead/${evolutionInstance}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evolutionApiKey },
      body: JSON.stringify({
        readMessages: [{ remoteJid, id: messageId, fromMe: false }]
      })
    });
  } catch (e) {
    console.error("markReadWithTyping falhou (ignorado):", e);
  }
}

/**
 * Baixa o base64 de uma midia recebida (foto de prato/corpo) -- a Evolution
 * nao manda o base64 embutido no payload do webhook por padrao (payload fica
 * gigante), entao busca sob demanda usando a key da mensagem original.
 */
export async function getMediaBase64(
  evolutionApiUrl: string,
  evolutionApiKey: string,
  evolutionInstance: string,
  messageKey: { remoteJid: string; id: string; fromMe: boolean }
): Promise<string | null> {
  try {
    const res = await fetch(`${evolutionApiUrl}/chat/getBase64FromMediaMessage/${evolutionInstance}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evolutionApiKey },
      body: JSON.stringify({ message: { key: messageKey }, convertToMp4: false })
    });
    if (!res.ok) {
      console.error("getMediaBase64 falhou:", res.status, await res.text());
      return null;
    }
    const json = await res.json();
    return json.base64 || null;
  } catch (e) {
    console.error("getMediaBase64 erro:", e);
    return null;
  }
}

// Windmill exige um export main() para o script ser um runnable valido.
// Esta lib nao deve ser executada diretamente, so importada por outros scripts.
export async function main() {
  return { ok: true, note: "lib_whatsapp e uma biblioteca compartilhada, importe as funcoes em vez de rodar direto" };
}
