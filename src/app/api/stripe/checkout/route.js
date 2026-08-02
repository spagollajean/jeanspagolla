import { NextResponse } from 'next/server';
import { stripe, PLANS } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '').trim();

    const { plan } = await req.json().catch(() => ({}));
    const planConfig = PLANS[plan];
    if (!planConfig) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (existingSubscription) {
      return NextResponse.json({ error: 'Usuário já possui uma assinatura ativa' }, { status: 400 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, stripe_customer_id')
      .eq('id', user.id)
      .single();

    // Reusa o Customer do Stripe se ja existir (evita duplicar ao tentar
    // de novo apos um checkout abandonado).
    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name || undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabaseAdmin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      redirect_on_completion: 'never',
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      subscription_data: {
        metadata: { supabase_user_id: user.id, plan },
      },
      metadata: { supabase_user_id: user.id, plan },
      locale: 'pt-BR',
    });

    return NextResponse.json({ client_secret: session.client_secret });
  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno ao processar pagamento' },
      { status: 400 }
    );
  }
}
