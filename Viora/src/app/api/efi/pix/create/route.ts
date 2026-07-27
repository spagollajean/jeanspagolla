import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { efi } from '@/lib/efi';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { PIX_PACKAGES, PixPackageKey } from '@/lib/efi-pix';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EXPIRATION_SECONDS = 3600; // 1h pra pagar o QR Code

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

    const { pkg } = (await req.json()) as { pkg: PixPackageKey };

    // Preço sempre resolvido no servidor — nunca confia no valor vindo do client.
    const selected = PIX_PACKAGES[pkg];

    if (!selected) {
      return NextResponse.json({ error: 'Pacote inválido' }, { status: 400 });
    }

    // `devedor` é opcional, mas se enviado exige CPF/CNPJ (confirmado no
    // sandbox) — omitimos o objeto inteiro pra não pedir CPF no Pix.
    const charge = await efi.pixCreateImmediateCharge(
      {},
      {
        calendario: { expiracao: EXPIRATION_SECONDS },
        valor: { original: selected.amount.toFixed(2) },
        chave: process.env.EFI_PIX_KEY!,
        solicitacaoPagador: `Viora PRO - ${selected.label}`,
      }
    );

    // `pixGenerateQRCode` (chamada de rede à EFI) deu insufficient_scope no
    // app atual — em vez de pedir mais um escopo, geramos a imagem do QR
    // localmente a partir do pixCopiaECola que já vem na resposta da cobrança.
    const imagemQrcode = await QRCode.toDataURL(charge.pixCopiaECola);

    await supabaseAdmin.from('payments').insert({
      user_id: user.id,
      efi_charge_id: charge.txid,
      amount: selected.amount,
      status: 'pending',
      plan_type: `package_${pkg}`,
      payment_method: 'pix',
    });

    return NextResponse.json({
      txid: charge.txid,
      qrcode: charge.pixCopiaECola,
      imagemQrcode,
      amount: selected.amount,
      expiresInSeconds: EXPIRATION_SECONDS,
    });
  } catch (error: any) {
    console.error('EFI Pix Create Error:', error);

    const message = error?.mensagem || error?.message || 'Erro ao gerar cobrança Pix';

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
