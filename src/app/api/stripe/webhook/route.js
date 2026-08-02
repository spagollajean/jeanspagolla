import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { notifyEmail } from '@/lib/notify-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RECURRING_PRICE = 14.99;
const FIRST_MONTH_PRICE = 5.0;

async function findUserId(customerId, subscriptionMetaUserId) {
  if (subscriptionMetaUserId) return subscriptionMetaUserId;
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  return data?.id || null;
}

export async function POST(req) {
  const sig = req.headers.get('stripe-signature');
  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature inválida:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      // Cobrança paga (1o mes ou renovacao mensal) -- fonte unica de verdade
      // pra ativar/renovar acesso. billing_reason diferencia 1a cobranca de
      // renovacao (so pra saber que valor mandar no e-mail).
      case 'invoice.paid': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription || null;
        const customerId = invoice.customer;

        const { data: existingPayment } = await supabaseAdmin
          .from('payments')
          .select('id')
          .eq('stripe_invoice_id', invoice.id)
          .maybeSingle();
        if (existingPayment) break;

        let subMetaUserId = null;
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          subMetaUserId = sub.metadata?.supabase_user_id || null;
        }
        const userId = await findUserId(customerId, subMetaUserId);
        if (!userId) {
          console.error('Stripe webhook: invoice paga sem usuario correspondente', invoice.id);
          break;
        }

        const isFirstInvoice = invoice.billing_reason === 'subscription_create';
        const amount = (invoice.amount_paid || 0) / 100;
        const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        await supabaseAdmin
          .from('subscriptions')
          .upsert(
            {
              user_id: userId,
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: customerId,
              status: 'active',
              plan: 'pro',
              valid_until: validUntil,
              cancel_at_period_end: false,
            },
            { onConflict: 'user_id' }
          );

        await supabaseAdmin.from('payments').insert({
          user_id: userId,
          stripe_invoice_id: invoice.id,
          amount,
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
          event: isFirstInvoice ? 'purchase_approved' : 'payment_receipt',
          email: profile?.email || null,
          name: profile?.full_name || null,
          amount: isFirstInvoice ? FIRST_MONTH_PRICE : RECURRING_PRICE,
          plan: 'PRO',
        });
        break;
      }

      // Cobranca falhou (cartao recusado) -- Stripe tenta de novo sozinho.
      // Nao avisa se foi o proprio usuario que ja cancelou (cancel_at_period_end).
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const { data: sub } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id, cancel_at_period_end')
          .eq('stripe_customer_id', customerId)
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
        break;
      }

      // Assinatura cancelada "de fora" (ex: retentativas esgotadas do
      // Stripe). Se ja era um cancelamento nosso (botao do usuario), o
      // acesso segue ate valid_until -- nao mexe no status aqui.
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const { data: row } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id, cancel_at_period_end')
          .eq('stripe_subscription_id', sub.id)
          .maybeSingle();

        if (row && !row.cancel_at_period_end) {
          await supabaseAdmin
            .from('subscriptions')
            .update({ status: 'canceled', cancel_at_period_end: false })
            .eq('stripe_subscription_id', sub.id);
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook handler failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
