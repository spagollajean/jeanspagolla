import { efi } from '@/lib/efi';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { notifyEmail } from '@/lib/notify-email';

// Preço por mês fixo (mais barato quanto maior o pacote) — total = perMonth * months.
export const PIX_PACKAGES = {
  '3m': { months: 3, amount: 38.97, label: 'Pacote 3 meses' },
  '6m': { months: 6, amount: 71.94, label: 'Pacote 6 meses' },
  '12m': { months: 12, amount: 131.88, label: 'Pacote 12 meses' },
} as const;

export type PixPackageKey = keyof typeof PIX_PACKAGES;

// Único ponto que decide se uma cobrança Pix foi paga e ativa a assinatura
// local — chamado tanto pelo polling do frontend quanto pelo webhook, pra
// não duplicar a lógica de confirmação (idempotente via payments.status).
export async function confirmPixCharge(txid: string): Promise<{ confirmed: boolean }> {
  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('id, user_id, status, plan_type, amount')
    .eq('efi_charge_id', txid)
    .maybeSingle();

  if (!payment) {
    return { confirmed: false };
  }

  if (payment.status === 'completed') {
    return { confirmed: true };
  }

  const detail = await efi.pixDetailCharge({ txid });
  const isPaid = detail.status === 'CONCLUIDA' || (detail.pix && detail.pix.length > 0);

  if (!isPaid) {
    return { confirmed: false };
  }

  // Claim atômico ANTES de creditar: webhook e polling do front chegam quase
  // juntos quando o Pix confirma, e um "lê pending → processa" nos dois dava
  // crédito em dobro (visto em produção: pacote de 3 meses virou 6). Só quem
  // vencer o UPDATE condicional segue; o outro já encontra completed.
  const { data: claimed } = await supabaseAdmin
    .from('payments')
    .update({ status: 'completed' })
    .eq('id', payment.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (!claimed) {
    return { confirmed: true };
  }

  const months = Number((payment.plan_type || '').replace('package_', '').replace('m', '')) || 0;

  try {
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('valid_until')
      .eq('user_id', payment.user_id)
      .maybeSingle();

    const currentValidUntil = subscription?.valid_until ? new Date(subscription.valid_until) : new Date();
    const base = currentValidUntil > new Date() ? currentValidUntil : new Date();
    const validUntil = new Date(base.getTime() + months * 30 * 24 * 60 * 60 * 1000).toISOString();

    await supabaseAdmin.from('subscriptions').upsert(
      {
        user_id: payment.user_id,
        status: 'active',
        plan: 'pro',
        valid_until: validUntil,
        cancel_at_period_end: false,
      },
      { onConflict: 'user_id' }
    );
  } catch (err) {
    // Devolve o claim pra próxima notificação/polling reprocessar — sem isso
    // o pagamento ficaria completed sem o crédito correspondente.
    await supabaseAdmin
      .from('payments')
      .update({ status: 'pending' })
      .eq('id', payment.id);
    throw err;
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('email, full_name')
    .eq('id', payment.user_id)
    .maybeSingle();

  // purchase_approved (não payment_receipt): pacote Pix é uma compra avulsa,
  // não renovação — e o template de renovação fala em "renovação da assinatura".
  // Este template converte amount pra número (string formatada vira NaN),
  // então vai o número cru — o "R$" já está no template.
  await notifyEmail({
    event: 'purchase_approved',
    email: profile?.email || null,
    name: profile?.full_name || null,
    amount: Number(payment.amount) || 0,
    plan: months ? `PRO (${months} meses via Pix)` : 'PRO',
  });

  return { confirmed: true };
}
