import { NextResponse } from 'next/server';
import { stripe, STRIPE_PRICE_ID_MONTHLY, STRIPE_COUPON_FIRST_MONTH } from '@/lib/stripe';
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

    // Cupom de boas-vindas (R$5 no 1o mes) so vale pra quem nunca pagou.
    const { data: pastPayment } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    const isFirstTime = !pastPayment;

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

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || '';

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      redirect_on_completion: 'never',
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: STRIPE_PRICE_ID_MONTHLY, quantity: 1 }],
      ...(isFirstTime ? { discounts: [{ coupon: STRIPE_COUPON_FIRST_MONTH }] } : {}),
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
      metadata: { supabase_user_id: user.id },
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
