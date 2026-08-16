import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Materiais fixos (PDFs bônus) disponíveis pra quem tem assinatura ativa.
// Ficam no bucket privado "materiais" -- URL assinada expira em 1h.
const MATERIALS = [
  {
    id: 'desinflamacao',
    title: 'Protocolo de Desinflamação (14 dias)',
    description: 'Guia prático de 14 dias pra reduzir inflamação através da alimentação.',
    storagePath: 'protocolo-desinflamacao-14dias.pdf',
  },
  {
    id: 'desintoxicacao',
    title: 'Protocolo de Desintoxicação',
    description: 'Passo a passo pra desintoxicar o organismo de forma natural.',
    storagePath: 'protocolo-desintoxicacao.pdf',
  },
  {
    id: 'rotina-habitos',
    title: 'Rotina Diária de Hábitos Saudáveis',
    description: 'Estrutura de rotina diária pra consolidar hábitos saudáveis.',
    storagePath: 'rotina-diaria-habito-saudavel.pdf',
  },
];

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

    const { data: entitlement, error: entError } = await supabaseAdmin.rpc(
      'get_active_entitlement',
      { p_user_id: user.id }
    );
    if (entError) throw entError;

    const isActive = !!(entitlement && entitlement.length > 0);
    if (!isActive) {
      return NextResponse.json({ error: 'Assinatura inativa' }, { status: 403 });
    }

    const materials = await Promise.all(
      MATERIALS.map(async (m) => {
        const { data, error } = await supabaseAdmin.storage
          .from('materiais')
          .createSignedUrl(m.storagePath, 3600);
        if (error) {
          console.error(`Erro ao gerar URL assinada pra ${m.storagePath}:`, error);
          return { ...m, url: null };
        }
        return { ...m, url: data?.signedUrl || null };
      })
    );

    return NextResponse.json({ materials });
  } catch (error) {
    console.error('Materials API Error:', error);
    return NextResponse.json({ error: 'Erro interno ao obter materiais' }, { status: 500 });
  }
}
