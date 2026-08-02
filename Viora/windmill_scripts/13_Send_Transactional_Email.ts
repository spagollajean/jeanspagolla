//nobundling
import * as wmill from "windmill-client";

/**
 * Windmill Script 13: Send Transactional Email
 *
 * O site principal (jeanspagolla.com.br/src/lib/notify-email.js) faz POST no
 * webhook deste script com um objeto cujas chaves batem com os parametros de
 * main() abaixo (event, email, name, amount, plan, includesViora, validUntil,
 * cardBrand, cardLast4, purchaseDate, nextBillingDate).
 *
 * Envia via Resend (API HTTP, sem SMTP) -- chave em u/admin/RESEND_API_KEY
 * (secret). Remetente: billing@jeanspagolla.com.br (dominio verificado no
 * Resend com SPF+DKIM). Eventos: purchase_approved, payment_receipt,
 * payment_failed, subscription_canceled.
 */

const C = {
  dark: "#12160F",
  dark1: "#1B2117",
  cream: "#F1E8D4",
  ink: "#241C13",
  inkSoft: "#4A3F30",
  ochre: "#C08A34",
  ochreBright: "#DDA646",
  moss: "#5B6B45",
  line: "rgba(36,28,19,0.12)",
};

const PLAN_FEATURES: Record<string, string[]> = {
  "Renascer Essencial": [
    "Aulas em vídeo com todos os protocolos",
    "Comunidade no Skool com acesso direto ao Jean",
    "Desafios, palestras e aulas ao vivo",
  ],
  "Renascer Completo": [
    "Tudo do Renascer Essencial",
    "APP Viora AI direto no WhatsApp",
    "Leitura de pratos por foto e calculadora metabólica",
    "Coach de treino e dieta disponível 24h",
  ],
};

const MAIN_SITE = "https://www.jeanspagolla.com.br";
const VIORA_SITE = "https://app.jeanspagolla.com.br";

function brl(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value.replace(",", ".")) : Number(value);
  if (!isFinite(n) || n <= 0) return "";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dateBR(input: string | null | undefined): string {
  const d = input ? new Date(input) : new Date();
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "long", year: "numeric" });
}

function row(label: string, value: string | null | undefined): string {
  if (!value) return "";
  return `<tr>
    <td style="padding:11px 0;border-bottom:1px solid ${C.line};font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${C.inkSoft};">${label}</td>
    <td style="padding:11px 0;border-bottom:1px solid ${C.line};font-family:'Courier New',monospace;font-size:13px;color:${C.ink};text-align:right;font-weight:bold;">${value}</td>
  </tr>`;
}

function detailsTable(rowsHtml: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;background:rgba(192,138,52,0.06);border:1px solid rgba(192,138,52,0.25);border-radius:10px;padding:4px 20px;">
    <tr><td>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
    </td></tr>
  </table>`;
}

function featureList(items: string[]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    ${items.map((f) => `<tr><td style="padding:6px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.ink};vertical-align:top;width:22px;">
        <span style="display:inline-block;width:16px;height:16px;line-height:16px;text-align:center;background:${C.moss};color:#fff;border-radius:50%;font-size:10px;">✓</span>
      </td><td style="padding:6px 0 6px 4px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.ink};">${f}</td></tr>`).join("")}
  </table>`;
}

function stepsList(items: string[]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    ${items.map((s, i) => `<tr><td style="padding:7px 0;font-family:'Courier New',monospace;font-size:12px;color:${C.ochre};vertical-align:top;width:26px;font-weight:bold;">${i + 1}.</td><td style="padding:7px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.ink};line-height:1.5;">${s}</td></tr>`).join("")}
  </table>`;
}

type LayoutInput = {
  eyebrow: string; icon: string; title: string; introHtml: string;
  detailsHtml?: string; extraHtml?: string;
  ctaLabel: string | null; ctaUrl: string | null; footNote?: string | null;
};

function layout({ eyebrow, icon, title, introHtml, detailsHtml, extraHtml, ctaLabel, ctaUrl, footNote }: LayoutInput): string {
  const cta = ctaLabel && ctaUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;">
        <tr><td style="border-radius:8px;background:${C.dark};">
          <a href="${ctaUrl}" style="display:inline-block;padding:15px 32px;color:${C.cream};text-decoration:none;font-family:'Courier New',monospace;font-weight:bold;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;">${ctaLabel} &rarr;</a>
        </td></tr>
      </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.dark};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.dark};padding:40px 14px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <tr><td style="padding-bottom:26px;text-align:center;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:24px;color:${C.cream};letter-spacing:0.01em;">Renascer</span>
          <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(241,232,212,0.45);margin-top:4px;">Acompanhamento com Jean Spagolla</div>
        </td></tr>

        <tr><td style="background:${C.cream};border-radius:14px;overflow:hidden;box-shadow:0 30px 70px -25px rgba(0,0,0,0.55);">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

            <tr><td style="background:linear-gradient(135deg,${C.ochre},${C.ochreBright});padding:32px 40px;">
              <div style="font-size:30px;line-height:1;margin-bottom:10px;">${icon}</div>
              <p style="margin:0 0 6px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${C.dark};opacity:0.72;">${eyebrow}</p>
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.3;color:${C.dark};font-weight:normal;">${title}</h1>
            </td></tr>

            <tr><td style="padding:32px 40px 40px;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${C.ink};">${introHtml}</div>
              ${detailsHtml || ""}
              ${extraHtml || ""}
              ${cta}
              ${footNote ? `<p style="margin:22px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${C.inkSoft};line-height:1.6;">${footNote}</p>` : ""}
            </td></tr>

          </table>
        </td></tr>

        <tr><td style="padding-top:20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.dark1};border-radius:10px;">
            <tr><td style="padding:18px 26px;text-align:center;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:rgba(241,232,212,0.6);line-height:1.6;">
                Dúvidas sobre sua assinatura? Responda este e-mail ou escreva para<br>
                <a href="mailto:contato@jeanspagolla.com.br" style="color:${C.ochreBright};text-decoration:none;font-weight:bold;">contato@jeanspagolla.com.br</a>
              </p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:22px 20px 0;text-align:center;">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:rgba(241,232,212,0.35);line-height:1.6;">
            © ${new Date().getFullYear()} Renascer — jeanspagolla.com.br
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

type Template = { subject: string } & LayoutInput;

function buildTemplate(event: string, data: {
  firstName: string; amount?: number | string | null; plan: string; includesViora?: boolean;
  validUntil?: string | null; cardBrand?: string | null; cardLast4?: string | null;
  purchaseDate?: string | null; nextBillingDate?: string | null;
}): Template {
  const { firstName, amount, plan, includesViora, validUntil, cardBrand, cardLast4, purchaseDate, nextBillingDate } = data;
  const amountFmt = brl(amount);
  const cardFmt = cardBrand && cardLast4 ? `${cardBrand.toUpperCase()} •••• ${cardLast4}` : null;
  const features = PLAN_FEATURES[plan] || [];

  switch (event) {
    case "purchase_approved": {
      const details = detailsTable(
        row("Plano", plan) +
        row("Valor cobrado hoje", amountFmt) +
        row("Forma de pagamento", cardFmt) +
        row("Data", dateBR(purchaseDate)) +
        row("Próxima cobrança", dateBR(nextBillingDate))
      );
      const extra = includesViora
        ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${C.inkSoft};text-transform:uppercase;letter-spacing:0.06em;margin:26px 0 4px;font-weight:bold;">O que você já tem acesso</p>${featureList(features)}`
        : `<p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${C.inkSoft};text-transform:uppercase;letter-spacing:0.06em;margin:26px 0 4px;font-weight:bold;">Próximos passos</p>${stepsList([
            "Você recebe por aqui o convite para a comunidade no Skool.",
            "Fique de olho no WhatsApp — o Jean ou a equipe entram em contato para te orientar.",
            "Acompanhe as aulas e desafios liberados no seu ritmo.",
          ])}`;
      return {
        subject: "✅ Pagamento aprovado — sua assinatura Renascer está ativa!",
        eyebrow: "Bem-vindo(a) ao Renascer",
        icon: "🌿",
        title: `Oi, ${firstName}! Sua jornada começa agora.`,
        introHtml: `<p>Seu pagamento foi aprovado e o plano <strong>${plan}</strong> já está ativo. Aqui embaixo estão os detalhes da sua assinatura.</p>`,
        detailsHtml: details,
        extraHtml: extra,
        ctaLabel: includesViora ? "Acessar o Viora" : null,
        ctaUrl: includesViora ? `${VIORA_SITE}/dashboard` : null,
        footNote: "Guarde este e-mail como comprovante da sua primeira cobrança.",
      };
    }
    case "payment_receipt": {
      const details = detailsTable(
        row("Plano", plan) +
        row("Valor pago", amountFmt) +
        row("Forma de pagamento", cardFmt) +
        row("Data da cobrança", dateBR(purchaseDate)) +
        row("Próxima renovação", dateBR(nextBillingDate))
      );
      return {
        subject: "Recibo — assinatura Renascer renovada",
        eyebrow: "Recibo de pagamento",
        icon: "🧾",
        title: `Renovação confirmada, ${firstName}.`,
        introHtml: `<p>Recebemos o pagamento da renovação da sua assinatura <strong>${plan}</strong>. Segue o recibo para seu controle.</p>`,
        detailsHtml: details,
        ctaLabel: null,
        ctaUrl: null,
        footNote: "Obrigado por continuar essa jornada com a gente.",
      };
    }
    case "payment_failed": {
      const details = detailsTable(
        row("Plano", plan) +
        row("Valor da cobrança", amountFmt) +
        row("Forma de pagamento", cardFmt) +
        row("Data da tentativa", dateBR(purchaseDate))
      );
      return {
        subject: "⚠️ Não conseguimos renovar sua assinatura Renascer",
        eyebrow: "Ação necessária",
        icon: "⚠️",
        title: `${firstName}, houve um problema com seu pagamento.`,
        introHtml: `<p>Tentamos processar a cobrança da sua assinatura <strong>${plan}</strong>, mas o pagamento não foi aprovado pelo seu banco ou operadora.</p>`,
        detailsHtml: details,
        extraHtml: `<p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${C.inkSoft};margin-top:18px;">O Stripe tenta cobrar novamente de forma automática nos próximos dias. Pra garantir que seu acesso não seja interrompido, confira se o cartão cadastrado está válido e com limite disponível.</p>`,
        ctaLabel: "Atualizar forma de pagamento",
        ctaUrl: `${MAIN_SITE}/checkout`,
      };
    }
    case "subscription_canceled": {
      const details = detailsTable(
        row("Plano cancelado", plan) +
        row("Acesso válido até", dateBR(validUntil))
      );
      return {
        subject: "Sua assinatura Renascer foi cancelada",
        eyebrow: "Cancelamento confirmado",
        icon: "👋",
        title: `Poxa, ${firstName}. Sentiremos sua falta.`,
        introHtml: `<p>Confirmamos o cancelamento da sua assinatura <strong>${plan}</strong>. Não haverá novas cobranças.</p>`,
        detailsHtml: details,
        extraHtml: `<p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.ink};margin-top:18px;">Seu acesso continua liberado até a data acima. Depois disso, a conta volta para o modo gratuito — mas seu histórico fica guardado, então voltar é rápido.</p>`,
        ctaLabel: "Reativar assinatura",
        ctaUrl: `${MAIN_SITE}/checkout`,
      };
    }
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
  validUntil?: string | null,
  cardBrand?: string | null,
  cardLast4?: string | null,
  purchaseDate?: string | null,
  nextBillingDate?: string | null
) {
  if (!email || !email.includes("@")) {
    throw new Error("Destinatário inválido (email ausente).");
  }

  const firstName = (name || "").trim().split(/\s+/)[0] || "tudo bem";
  const t = buildTemplate(event, {
    firstName, amount, plan: plan || "Renascer", includesViora: !!includesViora,
    validUntil, cardBrand, cardLast4, purchaseDate, nextBillingDate,
  });

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
      html: layout(t),
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Resend falhou (${res.status}): ${JSON.stringify(json)}`);
  }

  return { sent: true, event, to: email, id: json.id };
}
