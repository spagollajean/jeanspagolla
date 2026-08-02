const windmillWebhook = (process.env.WINDMILL_EMAIL_WEBHOOK_URL || '').trim();
const windmillToken = (process.env.WINDMILL_TOKEN || '').trim();

// Dispara e-mails transacionais via Windmill (script send_transactional_email,
// que formata valores/datas e envia via SMTP).
export async function notifyEmail(payload) {
  if (!windmillWebhook) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Webhook de e-mail não configurado — e-mail não enviado:', payload.event);
    }
    return;
  }

  const headers = { 'Content-Type': 'application/json' };
  if (windmillToken) {
    headers['Authorization'] = `Bearer ${windmillToken}`;
  }

  try {
    await fetch(windmillWebhook, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('Falha ao notificar webhook de e-mail:', err);
  }
}
