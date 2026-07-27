import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
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

    if (authError || !user) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (subscriptionError) {
      throw subscriptionError;
    }

    if (!subscription) {
      return NextResponse.json({
        active: false,
        plan: 'free',
        status: 'none',
        validUntil: null,
      });
    }

    // A assinatura é considerada ativa se status for 'active' E ainda dentro
    // do período pago. A EFI cancela imediatamente (sem "fim de ciclo" nativo
    // como o Stripe), então quem cancelou continua com status 'active' até
    // valid_until — é essa checagem que corta o acesso na hora certa em vez
    // de na hora do cancelamento.
    const isActive =
      subscription.status === 'active' &&
      (!subscription.valid_until || new Date(subscription.valid_until) > new Date());

    return NextResponse.json({
      active: isActive,
      plan: subscription.plan || 'free',
      status: subscription.status,
      validUntil: subscription.valid_until,
    });
  } catch (error: any) {
    console.error('Subscription Status Error:', error);

    return NextResponse.json(
      { error: 'Erro interno ao obter status da assinatura' },
      { status: 500 }
    );
  }
}
