//nobundling
import nodemailer from "nodemailer";
import * as wmill from "windmill-client";

/**
 * Windmill Script 13: Send Transactional Email
 *
 * Substitui o workflow "Viora - Emails Transacionais" do n8n (desativado).
 * O site (src/lib/notify-email.ts) faz POST no webhook deste script com
 * { event, email, name, amount, plan, valid_until }.
 *
 * Toda a formatação (R$, datas) acontece AQUI, num lugar só — o site manda
 * amount numérico cru. Eventos: purchase_approved, payment_receipt,
 * payment_failed, subscription_canceled.
 *
 * SMTP vem das Variables u/admin/SMTP_HOST, SMTP_PORT, SMTP_USER,
 * SMTP_PASSWORD (secret). Remetente: billing@app.jeanspagolla.com.br.
 */

const BRAND = "#16a34a";
const SITE = "https://app.jeanspagolla.com.br";

function brl(value: number | string | null | undefined): string {
  if (typeof value === "string" && value.trim().startsWith("R$")) return value.trim();
  const n = typeof value === "string" ? Number(value.replace(",", ".")) : Number(value);
  if (!isFinite(n) || n <= 0) return "";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dateBR(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function layout(title: string, bodyHtml: string, ctaLabel: string, ctaUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#f4f7f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f5;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e9e6;">
        <tr><td style="background:${BRAND};padding:20px 32px;">
          <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:-0.5px;">🥗 Viora</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:20px;color:#111827;">${title}</h1>
          <div style="font-size:15px;line-height:1.6;color:#374151;">${bodyHtml}</div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
            <tr><td style="border-radius:10px;background:${BRAND};">
              <a href="${ctaUrl}" style="display:inline-block;padding:13px 28px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;">${ctaLabel}</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 32px;background:#fafbfa;border-top:1px solid #eef1ef;">
          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
            Viora — Nutrição inteligente pelo WhatsApp.<br>
            Dúvidas? Responda este e-mail ou escreva para <a href="mailto:contato@app.jeanspagolla.com.br" style="color:${BRAND};">contato@app.jeanspagolla.com.br</a>.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

type Template = { subject: string; title: string; body: string; ctaLabel: string; ctaUrl: string };

function buildTemplate(
  event: string,
  firstName: string,
  amountFmt: string,
  plan: string,
  validUntilFmt: string
): Template {
  const amountPhrase = amountFmt ? ` no valor de <strong>${amountFmt}</strong>` : "";

  switch (event) {
    case "purchase_approved":
      return {
        subject: "✅ Pagamento aprovado — seu Viora PRO está ativo!",
        title: `Oi, ${firstName}! 🎉`,
        body: `<p>Seu pagamento${amountPhrase} foi aprovado e seu plano <strong>${plan}</strong> já está ativo.</p>
<p>Já pode mandar a foto do seu prato no WhatsApp e gerar sua dieta e treino!</p>`,
        ctaLabel: "Acessar meu painel",
        ctaUrl: `${SITE}/dashboard`,
      };
    case "payment_receipt":
      return {
        subject: "Recibo — assinatura Viora PRO renovada 💚",
        title: `Oi, ${firstName}!`,
        body: `<p>Confirmamos a renovação da sua assinatura <strong>${plan}</strong>${amountPhrase}.</p>
<p>Obrigado por continuar com a gente! 💚</p>`,
        ctaLabel: "Ver meus pagamentos",
        ctaUrl: `${SITE}/dashboard`,
      };
    case "payment_failed":
      return {
        subject: "⚠️ Não conseguimos renovar sua assinatura Viora",
        title: `Oi, ${firstName}.`,
        body: `<p>Tentamos processar a cobrança${amountPhrase} da sua assinatura, mas o pagamento não foi aprovado.</p>
<p>Vamos tentar de novo automaticamente. Se quiser garantir o acesso sem interrupção, confira se o cartão cadastrado está válido e com limite disponível.</p>`,
        ctaLabel: "Atualizar pagamento",
        ctaUrl: `${SITE}/checkout`,
      };
    case "subscription_canceled":
      return {
        subject: "Sua assinatura Viora foi cancelada",
        title: `Oi, ${firstName}.`,
        body: `<p>Confirmamos o cancelamento da sua assinatura.</p>
${validUntilFmt ? `<p>Seu acesso PRO continua funcionando até <strong>${validUntilFmt}</strong> — depois disso a conta volta pro modo gratuito.</p>` : ""}
<p>Mudou de ideia? É só assinar de novo quando quiser, a gente guarda seu histórico. 💚</p>`,
        ctaLabel: "Reativar assinatura",
        ctaUrl: `${SITE}/checkout`,
      };
    default:
      throw new Error(`Evento de e-mail desconhecido: ${event}`);
  }
}

export async function main(
  event: string,
  email: string,
  name?: string | null,
  amount?: number | string | null,
  plan?: string | null,
  valid_until?: string | null
) {
  if (!email || !email.includes("@")) {
    throw new Error("Destinatário inválido (email ausente).");
  }

  const firstName = (name || "").trim().split(/\s+/)[0] || "tudo bem";
  const t = buildTemplate(event, firstName, brl(amount), plan || "PRO", dateBR(valid_until));

  const host = await wmill.getVariable("u/admin/SMTP_HOST");
  const port = Number(await wmill.getVariable("u/admin/SMTP_PORT")) || 465;
  const user = await wmill.getVariable("u/admin/SMTP_USER");
  const password = await wmill.getVariable("u/admin/SMTP_PASSWORD");

  if (!host || !user || !password) {
    throw new Error("Credenciais SMTP ausentes nas Variables do Windmill (SMTP_HOST/SMTP_USER/SMTP_PASSWORD).");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
  });

  const info = await transporter.sendMail({
    from: `"Viora" <${user}>`,
    to: email,
    replyTo: "contato@app.jeanspagolla.com.br",
    subject: t.subject,
    html: layout(t.title, t.body, t.ctaLabel, t.ctaUrl),
  });

  return { sent: true, event, to: email, messageId: info.messageId };
}
