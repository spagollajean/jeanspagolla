import { NextResponse } from 'next/server';
import { PLANS } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
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

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', user.id)
      .maybeSingle();

    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('created_at, amount, status, plan_type, payment_method')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(24);

    const isActive = !!subscription &&
      subscription.status === 'active' &&
      (!subscription.valid_until || new Date(subscription.valid_until) > new Date());

    return NextResponse.json({
      name: profile?.full_name || null,
      email: profile?.email || user.email || null,
      plan: isActive ? subscription.plan : null,
      planLabel: isActive ? (PLANS[subscription.plan]?.label || subscription.plan) : null,
      includesViora: isActive ? !!PLANS[subscription.plan]?.includesViora : false,
      status: subscription?.status || 'none',
      validUntil: subscription?.valid_until || null,
      cancelAtPeriodEnd: !!subscription?.cancel_at_period_end,
      payments: payments || [],
    });
  } catch (error) {
    console.error('Account Status Error:', error);
    return NextResponse.json({ error: 'Erro interno ao obter status da conta' }, { status: 500 });
  }
}
