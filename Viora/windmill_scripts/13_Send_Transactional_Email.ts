//nobundling
import * as wmill from "windmill-client";

/**
 * Windmill Script 13: Send Transactional Email
 *
 * O site principal (jeanspagolla.com.br/src/lib/notify-email.js) faz POST no
 * webhook deste script com { event, email, name, amount, plan, includesViora,
 * valid_until }. `plan` e o nome legivel do plano (ex: "Renascer Completo"),
 * `includesViora` diz se esse plano inclui o app Viora no WhatsApp.
 *
 * Envia via Resend (API HTTP, sem SMTP) -- chave em u/admin/RESEND_API_KEY
 * (secret). Remetente: billing@jeanspagolla.com.br (dominio verificado no
 * Resend com SPF+DKIM). Eventos: purchase_approved, payment_receipt,
 * payment_failed, subscription_canceled.
 */

const BRAND_DARK = "#12160F";
const BRAND_CREAM = "#F1E8D4";
const BRAND_OCHRE = "#C08A34";
const BRAND_OCHRE_BRIGHT = "#DDA646";
const BRAND_INK = "#241C13";

const MAIN_SITE = "https://www.jeanspagolla.com.br";
const VIORA_SITE = "https://app.jeanspagolla.com.br";

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

function layout(eyebrow: string, title: string, bodyHtml: string, ctaLabel: string | null, ctaUrl: string | null): string {
  const cta = ctaLabel && ctaUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:26px;">
        <tr><td style="border-radius:8px;background:${BRAND_DARK};">
          <a href="${ctaUrl}" style="display:inline-block;padding:14px 30px;color:${BRAND_CREAM};text-decoration:none;font-family:'Courier New',monospace;font-weight:bold;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;">${ctaLabel}</a>
        </td></tr>
      </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND_DARK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_DARK};padding:44px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">
        <tr><td style="padding-bottom:30px;text-align:center;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:28px;color:${BRAND_CREAM};letter-spacing:0.01em;">Renascer</span>
        </td></tr>
        <tr><td style="background:${BRAND_CREAM};border-radius:14px;overflow:hidden;box-shadow:0 30px 60px -25px rgba(0,0,0,0.5);">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:linear-gradient(135deg,${BRAND_OCHRE},${BRAND_OCHRE_BRIGHT});padding:30px 38px;">
              <p style="margin:0 0 8px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND_DARK};opacity:0.72;">${eyebrow}</p>
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:25px;color:${BRAND_DARK};font-weight:normal;">${title}</h1>
            </td></tr>
            <tr><td style="padding:34px 38px 38px;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:${BRAND_INK};">${bodyHtml}</div>
              ${cta}
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:30px 20px 0;text-align:center;">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:rgba(241,232,212,0.5);line-height:1.6;">
            Renascer — acompanhamento com Jean Spagolla.<br>
            Dúvidas? Responda este e-mail ou escreva para <a href="mailto:contato@jeanspagolla.com.br" style="color:${BRAND_OCHRE_BRIGHT};">contato@jeanspagolla.com.br</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

type Template = { subject: string; eyebrow: string; title: string; body: string; ctaLabel: string | null; ctaUrl: string | null };

function buildTemplate(
  event: string,
  firstName: string,
  amountFmt: string,
  plan: string,
  includesViora: boolean,
  validUntilFmt: string
): Template {
  const amountPhrase = amountFmt ? ` no valor de <strong>${amountFmt}</strong>` : "";
  const vioraNote = includesViora
    ? `<p>Seu acesso ao <strong>Viora</strong> (o app de IA no WhatsApp) já está liberado.</p>`
    : "";

  switch (event) {
    case "purchase_approved":
      return {
        subject: "✅ Pagamento aprovado — sua assinatura Renascer está ativa!",
        eyebrow: "Bem-vindo(a) ao Renascer",
        title: `Oi, ${firstName}! 🎉`,
        body: `<p>Seu pagamento${amountPhrase} foi aprovado e o plano <strong>${plan}</strong> já está ativo.</p>
${vioraNote}
<p>Em breve você recebe os próximos passos (acesso às aulas e à comunidade) por aqui mesmo.</p>`,
        ctaLabel: includesViora ? "Acessar o Viora" : null,
        ctaUrl: includesViora ? `${VIORA_SITE}/dashboard` : null,
      };
    case "payment_receipt":
      return {
        subject: "Recibo — assinatura Renascer renovada",
        eyebrow: "Recibo de pagamento",
        title: `Oi, ${firstName}!`,
        body: `<p>Confirmamos a renovação da sua assinatura <strong>${plan}</strong>${amountPhrase}.</p>
<p>Obrigado por continuar com a gente!</p>`,
        ctaLabel: null,
        ctaUrl: null,
      };
    case "payment_failed":
      return {
        subject: "⚠️ Não conseguimos renovar sua assinatura Renascer",
        eyebrow: "Ação necessária",
        title: `Oi, ${firstName}.`,
        body: `<p>Tentamos processar a cobrança${amountPhrase} da sua assinatura <strong>${plan}</strong>, mas o pagamento não foi aprovado.</p>
<p>Vamos tentar de novo automaticamente. Se quiser garantir o acesso sem interrupção, confira se o cartão cadastrado está válido e com limite disponível.</p>`,
        ctaLabel: "Atualizar pagamento",
        ctaUrl: `${MAIN_SITE}/checkout`,
      };
    case "subscription_canceled":
      return {
        subject: "Sua assinatura Renascer foi cancelada",
        eyebrow: "Cancelamento confirmado",
        title: `Oi, ${firstName}.`,
        body: `<p>Confirmamos o cancelamento da sua assinatura <strong>${plan}</strong>.</p>
${validUntilFmt ? `<p>Seu acesso continua funcionando até <strong>${validUntilFmt}</strong> — depois disso a conta volta pro modo gratuito.</p>` : ""}
<p>Mudou de ideia? É só assinar de novo quando quiser.</p>`,
        ctaLabel: "Reativar assinatura",
        ctaUrl: `${MAIN_SITE}/checkout`,
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
  includesViora?: boolean | null,
  valid_until?: string | null
) {
  if (!email || !email.includes("@")) {
    throw new Error("Destinatário inválido (email ausente).");
  }

  const firstName = (name || "").trim().split(/\s+/)[0] || "tudo bem";
  const t = buildTemplate(event, firstName, brl(amount), plan || "Renascer", !!includesViora, dateBR(valid_until));

  const RESEND_API_KEY = await wmill.getVariable("u/admin/RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY ausente nas Variables do Windmill.");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Renascer <billing@jeanspagolla.com.br>",
      to: [email],
      reply_to: "contato@jeanspagolla.com.br",
      subject: t.subject,
      html: layout(t.eyebrow, t.title, t.body, t.ctaLabel, t.ctaUrl),
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Resend falhou (${res.status}): ${JSON.stringify(json)}`);
  }

  return { sent: true, event, to: email, id: json.id };
}
