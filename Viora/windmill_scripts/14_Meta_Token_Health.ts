//nobundling
import nodemailer from "nodemailer";
import * as wmill from "windmill-client";

/**
 * Windmill Script 14: Vigia do token do WhatsApp (Meta).
 *
 * O META_ACCESS_TOKEN é de system user "sem validade", mas Meta é Meta —
 * pode invalidar a qualquer momento (troca de senha, revisão do app, etc).
 * Este script roda agendado (a cada 6h) e faz uma chamada REAL na Graph API.
 *
 * Se a Meta recusar por autenticação (HTTP 401/403 ou error.code 190):
 *   1. abre ticket URGENTE no Saas Master (aparece no dashboard do painel);
 *   2. manda e-mail pro Marcio — canal independente do WhatsApp, porque com
 *      o token morto o próprio bot não consegue avisar.
 * Dedupe: se já existe ticket aberto deste alerta, não manda e-mail de novo.
 * Erro de rede/5xx NÃO alarma (não é token morto) — só registra no retorno.
 */

const ALERT_EMAIL = "bevervansomarcio@gmail.com";
const SAASMASTER_FOODSNAP_PROJECT_ID = "1d0590b9-6fe3-4793-a9b7-ef5ea29f4b23";
const TICKET_TITLE = "Token do WhatsApp (Meta) invalido — bot fora do ar";

export async function main() {
  const META_TOKEN = await wmill.getVariable("u/admin/META_ACCESS_TOKEN") as string;
  const META_PHONE_ID = await wmill.getVariable("u/admin/META_PHONE_NUMBER_ID") as string;

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${META_PHONE_ID}?fields=display_phone_number,quality_rating`,
    { headers: { Authorization: `Bearer ${META_TOKEN}` } },
  );

  if (res.ok) {
    const info = await res.json();
    return { healthy: true, phone: info.display_phone_number, quality: info.quality_rating };
  }

  const bodyText = await res.text();
  let isAuthError = res.status === 401 || res.status === 403;
  try {
    const errJson = JSON.parse(bodyText);
    if (errJson?.error?.code === 190) isAuthError = true; // 190 = token inválido/expirado
  } catch { /* corpo não-JSON, mantém decisão pelo status */ }

  if (!isAuthError) {
    // Instabilidade da Meta/rede — não é token morto, não alarma
    return { healthy: false, transient: true, status: res.status, body: bodyText.slice(0, 300) };
  }

  // ── Token morto de verdade: ticket no Saas Master + e-mail ──────────────
  const smUrl = (await wmill.getVariable("u/admin/SAASMASTER_SUPABASE_URL") as string).replace(/\/$/, "");
  const smKey = await wmill.getVariable("u/admin/SAASMASTER_SERVICE_KEY") as string;
  const smHeaders = {
    "Content-Type": "application/json",
    apikey: smKey,
    Authorization: `Bearer ${smKey}`,
  };

  // Dedupe: já existe ticket aberto deste alerta?
  const existingRes = await fetch(
    `${smUrl}/rest/v1/tickets?project_id=eq.${SAASMASTER_FOODSNAP_PROJECT_ID}&status=eq.open&title=eq.${encodeURIComponent(TICKET_TITLE)}&select=id`,
    { headers: smHeaders },
  );
  const existing = existingRes.ok ? await existingRes.json() : [];
  if (Array.isArray(existing) && existing.length > 0) {
    return { healthy: false, auth_error: true, alerted: "ja_avisado", status: res.status };
  }

  const description =
    `A Graph API recusou o META_ACCESS_TOKEN em ${new Date().toISOString()} (HTTP ${res.status}).\n\n` +
    `Resposta da Meta:\n${bodyText.slice(0, 600)}\n\n` +
    `Como resolver: gerar um novo token de system user no Meta Business Suite ` +
    `(WhatsApp > Configurações da API) e atualizar a variável ` +
    `u/admin/META_ACCESS_TOKEN no Windmill.`;

  await fetch(`${smUrl}/rest/v1/tickets`, {
    method: "POST",
    headers: { ...smHeaders, Prefer: "return=minimal" },
    body: JSON.stringify({
      project_id: SAASMASTER_FOODSNAP_PROJECT_ID,
      title: TICKET_TITLE,
      description,
      status: "open",
      priority: "urgent",
    }),
  });

  // E-mail (mesmo SMTP dos transacionais — independente da Meta)
  const host = await wmill.getVariable("u/admin/SMTP_HOST") as string;
  const port = Number(await wmill.getVariable("u/admin/SMTP_PORT")) || 465;
  const user = await wmill.getVariable("u/admin/SMTP_USER") as string;
  const password = await wmill.getVariable("u/admin/SMTP_PASSWORD") as string;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
  });

  await transporter.sendMail({
    from: '"Viora Vigia" <billing@app.jeanspagolla.com.br>',
    to: ALERT_EMAIL,
    subject: "🚨 URGENTE: token do WhatsApp (Meta) inválido — bot do Viora fora do ar",
    html: `<p><strong>O token do WhatsApp foi recusado pela Meta</strong> (HTTP ${res.status}) em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.</p>
<p>O bot NÃO consegue enviar nem receber mensagens até trocar o token.</p>
<p><strong>Como resolver:</strong> Meta Business Suite → WhatsApp → Configurações da API → gerar novo token do system user → atualizar a variável <code>META_ACCESS_TOKEN</code> no Windmill (windmill.seureview.com.br, workspace foodsnap).</p>
<p style="color:#6b7280;font-size:12px;">Resposta da Meta: ${bodyText.slice(0, 300).replace(/</g, "&lt;")}</p>
<p style="color:#6b7280;font-size:12px;">Ticket aberto no Saas Master. Este aviso não se repete enquanto o ticket estiver aberto.</p>`,
  });

  return { healthy: false, auth_error: true, alerted: true, status: res.status };
}
