import { NextResponse } from 'next/server';
import { efi } from '@/lib/efi';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { notifyEmail } from '@/lib/notify-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RECURRING_PRICE = 14.99;

const isDev = process.env.NODE_ENV === 'development';

function devLog(...args: any[]) {
  if (isDev) {
    console.log(...args);
  }
}

async function extractNotificationToken(req: Request): Promise<string | null> {
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => null);
    return body?.notification || null;
  }

  const text = await req.text();
  const params = new URLSearchParams(text);
  return params.get('notification');
}

export async function POST(req: Request) {
  try {
    const token = await extractNotificationToken(req);

    if (!token) {
      return NextResponse.json({ error: 'Notification token ausente' }, { status: 400 });
    }

    const result = await efi.getNotification({ token: token.trim() });

    for (const event of result.data) {
      const currentStatus = event.status?.current;
      const { subscription_id, charge_id } = event.identifiers || {};

      devLog('EFI notification event:', event.type, currentStatus, event.identifiers);

      // Evento no nível da assinatura (cancelamento, principalmente).
      if (subscription_id) {
        if (currentStatus === 'canceled') {
          const { data: sub } = await supabaseAdmin
            .from('subscriptions')
            .select('user_id, cancel_at_period_end, valid_until')
            .eq('efi_subscription_id', String(subscription_id))
            .maybeSingle();

          // Se já era um cancelamento agendado por nós (botão "cancelar" do
          // usuário), o acesso segue até valid_until — não mexe no status.
          // Só uma assinatura cancelada "de fora" (ex: retentativas esgotadas)
          // deve derrubar o acesso na hora.
          if (sub && !sub.cancel_at_period_end) {
            await supabaseAdmin
              .from('subscriptions')
              .update({ status: 'canceled', cancel_at_period_end: false })
              .eq('efi_subscription_id', String(subscription_id));
          }
        }
      }

      // Evento no nível de uma cobrança (1º pagamento avulso ou renovação mensal).
      if (charge_id) {
        if (currentStatus === 'paid') {
          const { data: existingPayment } = await supabaseAdmin
            .from('payments')
            .select('id')
            .eq('efi_charge_id', String(charge_id))
            .maybeSingle();

          // Cobrança já registrada (ex: o R$5 inicial já foi gravado na hora
          // do checkout) — nada a fazer além de confirmar.
          if (existingPayment) {
            continue;
          }

          // Cobrança nova e paga sem registro prévio: é uma renovação mensal.
          let userId: string | null = null;

          if (subscription_id) {
            const { data: sub } = await supabaseAdmin
              .from('subscriptions')
              .select('user_id')
              .eq('efi_subscription_id', String(subscription_id))
              .maybeSingle();
            userId = sub?.user_id || null;
          }

          if (!userId) {
            devLog('EFI webhook: cobrança paga sem assinatura correspondente', charge_id);
            continue;
          }

          const validUntil = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString();

          await supabaseAdmin
            .from('subscriptions')
            .update({ status: 'active', valid_until: validUntil })
            .eq('user_id', userId);

          await supabaseAdmin.from('payments').insert({
            user_id: userId,
            efi_charge_id: String(charge_id),
            amount: RECURRING_PRICE,
            status: 'completed',
            plan_type: 'monthly',
            payment_method: 'credit_card',
          });

          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .maybeSingle();

          await notifyEmail({
            event: 'payment_receipt',
            email: profile?.email || null,
            name: profile?.full_name || null,
            amount: RECURRING_PRICE,
            plan: 'PRO',
          });
        }

        // Só 'unpaid' é falha de cobrança de verdade (cartão negado — a EFI
        // vai retentar). 'canceled' acontece quando NÓS cancelamos a
        // assinatura (a cobrança pendente é cancelada junto) — mandar e-mail
        // de "vamos tentar de novo" nesse caso assusta o usuário à toa.
        // cancel_at_period_end cobre a mesma janela por outro ângulo: se o
        // próprio usuário cancelou, nenhum aviso de cobrança faz sentido.
        if (currentStatus === 'unpaid' && subscription_id) {
          const { data: sub } = await supabaseAdmin
            .from('subscriptions')
            .select('user_id, cancel_at_period_end')
            .eq('efi_subscription_id', String(subscription_id))
            .maybeSingle();

          if (sub?.user_id && !sub.cancel_at_period_end) {
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('email, full_name')
              .eq('id', sub.user_id)
              .maybeSingle();

            await notifyEmail({
              event: 'payment_failed',
              email: profile?.email || null,
              name: profile?.full_name || null,
              amount: RECURRING_PRICE,
            });
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('EFI webhook handler failed:', error);

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
