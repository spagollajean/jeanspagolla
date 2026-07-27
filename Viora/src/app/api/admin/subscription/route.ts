import { NextResponse } from 'next/server';
import { efi } from '@/lib/efi';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Endpoint administrativo chamado pelo painel Saas Master (server-to-server).
// Protegido por chave compartilhada — NUNCA expor a chave no cliente.
// Única ação por ora: cancelar a recorrência na Efí (o resto — plano, status,
// valid_until — o painel escreve direto no banco via service role).
export async function POST(req: Request) {
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey || req.headers.get('x-admin-key') !== adminKey) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { user_id, action } = await req.json();

    if (!user_id || action !== 'cancel_efi') {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('efi_subscription_id, valid_until')
      .eq('user_id', user_id)
      .maybeSingle();

    if (!subscription) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
    }

    if (subscription.efi_subscription_id) {
      try {
        await efi.cancelSubscription({ id: Number(subscription.efi_subscription_id) });
      } catch (err: any) {
        // Já cancelada na Efí não é erro fatal — segue e marca localmente.
        console.error('Admin cancel: falha ao cancelar na Efí (pode já estar cancelada):', err?.message || err);
      }
    }

    await supabaseAdmin
      .from('subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('user_id', user_id);

    return NextResponse.json({
      success: true,
      had_efi_subscription: Boolean(subscription.efi_subscription_id),
      valid_until: subscription.valid_until,
    });
  } catch (error: any) {
    console.error('Admin Subscription Error:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
