import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { normalizePhone } from '@/lib/phone';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Checa e-mail/telefone duplicados ANTES do usuário preencher os dados de
// pagamento — sem isso, o erro só aparecia no signUp() do passo 2, depois
// do usuário já ter digitado cartão/CPF à toa.
export async function POST(req) {
  try {
    const { email, phone } = await req.json();

    const normalizedEmail = (email || '').trim().toLowerCase();
    const phoneDigits = normalizePhone(phone || '');

    const [emailResult, phoneResult] = await Promise.all([
      normalizedEmail
        ? supabaseAdmin.from('profiles').select('id').eq('email', normalizedEmail).maybeSingle()
        : Promise.resolve({ data: null }),
      phoneDigits
        ? supabaseAdmin.from('profiles').select('id').eq('phone', phoneDigits).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    return NextResponse.json({
      emailTaken: !!emailResult.data,
      phoneTaken: !!phoneResult.data,
    });
  } catch (error) {
    console.error('Check Availability Error:', error);
    return NextResponse.json({ error: 'Erro ao validar dados' }, { status: 500 });
  }
}
