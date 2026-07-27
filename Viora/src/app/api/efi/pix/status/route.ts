import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { confirmPixCharge } from '@/lib/efi-pix';

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

    const { txid } = await req.json();

    if (!txid) {
      return NextResponse.json({ error: 'txid ausente' }, { status: 400 });
    }

    // Só confirma cobranças que pertencem ao usuário autenticado.
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('user_id')
      .eq('efi_charge_id', txid)
      .maybeSingle();

    if (!payment || payment.user_id !== user.id) {
      return NextResponse.json({ error: 'Cobrança não encontrada' }, { status: 404 });
    }

    const { confirmed } = await confirmPixCharge(txid);

    return NextResponse.json({ paid: confirmed });
  } catch (error: any) {
    console.error('EFI Pix Status Error:', error);

    return NextResponse.json({ error: 'Erro ao consultar status do Pix' }, { status: 500 });
  }
}
