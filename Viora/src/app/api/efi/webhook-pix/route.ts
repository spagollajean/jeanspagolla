import { NextResponse } from 'next/server';
import { confirmPixCharge } from '@/lib/efi-pix';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Formato padrão BACEN: a EFI faz POST direto com o payload da cobrança,
// diferente do webhook da API Cobranças (que só manda um token pra buscar
// depois). Aqui não precisa de round-trip — o próprio payload já confirma.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const events: Array<{ txid?: string }> = body?.pix || [];

    for (const event of events) {
      if (event.txid) {
        await confirmPixCharge(event.txid);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('EFI Pix webhook handler failed:', error);

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
