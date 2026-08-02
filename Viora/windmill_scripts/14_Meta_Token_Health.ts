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
 * Se a Meta recusar por autenticação (HTTP 401/403 ou error.code 190), manda
 * e-mail pra ALERT_EMAIL — canal independente do WhatsApp, porque com o
 * token morto o próprio bot não consegue avisar.
 * Dedupe: guarda um flag numa Variable do Windmill pra não mandar e-mail de
 * novo enquanto o problema não for resolvido (fica saudável de novo).
 * Erro de rede/5xx NÃO alarma (não é token morto) — só registra no retorno.
 */

const TICKET_TITLE = "Token do WhatsApp (Meta) invalido — bot fora do ar";

export async function main() {
  const META_TOKEN = await wmill.getVariable("u/admin/META_ACCESS_TOKEN") as string;
  const META_PHONE_ID = await wmill.getVariable("u/admin/META_PHONE_NUMBER_ID") as string;
  const ALERT_EMAIL = await wmill.getVariable("u/admin/ALERT_EMAIL") as string;

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${META_PHONE_ID}?fields=display_phone_number,quality_rating`,
    { headers: { Authorization: `Bearer ${META_TOKEN}` } },
  );

  if (res.ok) {
    const info = await res.json();
    // Token voltou a funcionar -- limpa o flag de alerta pra avisar de novo
    // se cair outra vez no futuro.
    try {
      await wmill.setVariable("u/admin/META_TOKEN_ALERT_SENT", "");
    } catch { /* variable pode nao existir ainda, tudo bem */ }
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

  // Dedupe: ja avisamos dessa queda e ainda nao voltou a ficar saudavel?
  let alreadyAlerted = "";
  try {
    alreadyAlerted = (await wmill.getVariable("u/admin/META_TOKEN_ALERT_SENT")) as string;
  } catch { /* variable pode nao existir ainda na primeira vez */ }
  if (alreadyAlerted === "true") {
    return { healthy: false, auth_error: true, alerted: "ja_avisado", status: res.status };
  }

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
    subject: `🚨 URGENTE: ${TICKET_TITLE}`,
    html: `<p><strong>O token do WhatsApp foi recusado pela Meta</strong> (HTTP ${res.status}) em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.</p>
<p>O bot NÃO consegue enviar nem receber mensagens até trocar o token.</p>
<p><strong>Como resolver:</strong> Meta Business Suite → WhatsApp → Configurações da API → gerar novo token do system user → atualizar a variável <code>META_ACCESS_TOKEN</code> no Windmill.</p>
<p style="color:#6b7280;font-size:12px;">Resposta da Meta: ${bodyText.slice(0, 300).replace(/</g, "&lt;")}</p>
<p style="color:#6b7280;font-size:12px;">Este aviso não se repete até o token voltar a funcionar.</p>`,
  });

  await wmill.setVariable("u/admin/META_TOKEN_ALERT_SENT", "true");

  return { healthy: false, auth_error: true, alerted: true, status: res.status };
}
