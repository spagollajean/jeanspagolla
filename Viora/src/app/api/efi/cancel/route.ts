import { NextResponse } from 'next/server';
import { efi } from '@/lib/efi';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { notifyEmail } from '@/lib/notify-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
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
      .eq('status', 'active')
      .maybeSingle();

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { error: 'Nenhuma assinatura ativa encontrada' },
        { status: 404 }
      );
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .maybeSingle();
    const email = profile?.email || user.email || null;
    const name = profile?.full_name || null;

    // A EFI cancela a assinatura imediatamente (sem "cancelar no fim do
    // ciclo" nativo). Cancelamos agora pra garantir que nenhuma cobrança
    // futura seja disparada, mas o acesso continua liberado localmente até
    // valid_until — status permanece 'active', só cancel_at_period_end muda.
    if (subscription.efi_subscription_id) {
      try {
        await efi.cancelSubscription({ id: Number(subscription.efi_subscription_id) });
      } catch (err: any) {
        console.error('Falha ao cancelar assinatura na EFI (pode já estar cancelada):', err);
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

    return NextResponse.json({
      success: true,
      valid_until: subscription.valid_until || null,
      message:
        'Assinatura cancelada. Você mantém o acesso PRO até o fim do período já pago.',
    });
  } catch (error: any) {
    console.error('EFI Cancel Subscription Error:', error);

    return NextResponse.json(
      { error: error.message || 'Erro interno ao cancelar assinatura' },
      { status: 500 }
    );
  }
}
