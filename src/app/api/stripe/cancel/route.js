import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { notifyEmail } from '@/lib/notify-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Chamado tanto pelo checkout do site principal quanto pelo botão "Cancelar
// assinatura" do dashboard do Viora (app.jeanspagolla.com.br) — o app não tem
// a chave da Stripe, só chama essa API de fora. Por isso o CORS liberado.
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_VIORA_APP_URL || 'https://app.jeanspagolla.com.br';

function withCors(res) {
  res.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  return res;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return withCors(NextResponse.json({ error: 'Não autorizado' }, { status: 401 }));
    }
    const token = authHeader.replace('Bearer ', '').trim();

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return withCors(NextResponse.json({ error: 'Sessão inválida' }, { status: 401 }));
    }

    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (subscriptionError || !subscription) {
      return withCors(NextResponse.json({ error: 'Nenhuma assinatura ativa encontrada' }, { status: 404 }));
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .maybeSingle();
    const email = profile?.email || user.email || null;
    const name = profile?.full_name || null;

    // cancel_at_period_end: o Stripe para de cobrar no fim do ciclo atual,
    // mas o acesso continua liberado ate la (valid_until local ja reflete
    // o fim do periodo pago).
    if (subscription.stripe_subscription_id) {
      try {
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
      } catch (err) {
        console.error('Falha ao cancelar assinatura no Stripe (pode já estar cancelada):', err);
      }
    }

    await supabaseAdmin
      .from('subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('user_id', user.id);

    await notifyEmail({
      event: 'subscription_canceled',
      email,
      name,
      valid_until: subscription.valid_until || null,
    });

    return withCors(NextResponse.json({
      success: true,
      valid_until: subscription.valid_until || null,
      message: 'Assinatura cancelada. Você mantém o acesso PRO até o fim do período já pago.',
    }));
  } catch (error) {
    console.error('Stripe Cancel Subscription Error:', error);
    return withCors(NextResponse.json({ error: error.message || 'Erro interno ao cancelar assinatura' }, { status: 500 }));
  }
}
