import { NextResponse } from 'next/server';
import { efi } from '@/lib/efi';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { notifyEmail } from '@/lib/notify-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FIRST_MONTH_PRICE_CENTS = 500; // R$ 5,00
const RECURRING_PRICE_CENTS = 1499; // R$ 14,99
const TRIAL_DAYS = 30;

// A EFI só aceita telefone BR sem o código do país: DDD (2 dígitos) + 8/9
// dígitos (regex deles: ^[1-9]{2}9?[0-9]{8}$). O telefone salvo no perfil
// vem com "55" na frente (ou outro DDI, pra usuários internacionais do
// WhatsApp) — removemos o 55 aqui; cobrança por cartão via EFI é BR-only
// de qualquer forma (exige CPF).
function toEfiPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length > 11 && digits.startsWith('55')) {
    return digits.slice(2);
  }
  return digits;
}

type CheckoutBody = {
  cpf: string;
  phone: string;
  payment_token: string;
  card_mask?: string;
};

export async function POST(req: Request) {
  try {
    const planId = (process.env.EFI_PLAN_ID_MONTHLY || '').trim();

    if (!planId) {
      return NextResponse.json(
        { error: 'EFI_PLAN_ID_MONTHLY não configurado' },
        { status: 500 }
      );
    }

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

    const body: CheckoutBody = await req.json();
    const { cpf, phone, payment_token } = body;

    if (!cpf || !phone || !payment_token) {
      return NextResponse.json(
        { error: 'Dados de cobrança incompletos' },
        { status: 400 }
      );
    }

    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'Usuário já possui uma assinatura ativa' },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Perfil do usuário não encontrado' },
        { status: 404 }
      );
    }

    // Cupom de boas-vindas (R$5 no 1º mês) só vale para quem NUNCA pagou.
    const { data: pastPayment } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    const isFirstTime = !pastPayment;

    // A EFI exige notification_url em HTTPS público (rejeita http/localhost
    // com "A propriedade [notification_url] é inválida" — confirmado no
    // sandbox). Em dev local não tem como registrar de verdade mesmo (a EFI
    // não alcança localhost), então omitimos o campo nesse caso.
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || '';
    const notificationUrl = origin.startsWith('https://') ? `${origin}/api/efi/webhook` : undefined;

    // A EFI não exige endereço/nascimento pra cobrança de cartão nem pra
    // assinatura (confirmado via teste direto no sandbox) — só nome, CPF,
    // email e telefone.
    const customer = {
      name: profile.full_name || user.email,
      cpf: cpf.replace(/\D/g, ''),
      email: user.email,
      phone_number: toEfiPhone(phone),
    };

    let chargeId: number | null = null;

    // A EFI não replica o cupom "R$5 no 1º mês" nativamente: cobramos o R$5
    // avulso agora e criamos a assinatura de R$14,99 com trial_days, então a
    // 1ª cobrança recorrente só dispara depois do período promocional.
    if (isFirstTime) {
      const chargeResult = await efi.createOneStepCharge(
        {},
        {
          items: [
            { name: 'Viora PRO - 1º mês', value: FIRST_MONTH_PRICE_CENTS, amount: 1 },
          ],
          metadata: { notification_url: notificationUrl, custom_id: user.id },
          payment: {
            credit_card: {
              customer,
              installments: 1,
              payment_token,
            },
          },
        }
      );

      chargeId = chargeResult.data.charge_id;
    }

    const subscriptionResult = await efi.createOneStepSubscription(
      { id: Number(planId) },
      {
        items: [
          { name: 'Viora PRO Mensal', value: RECURRING_PRICE_CENTS, amount: 1 },
        ],
        metadata: { notification_url: notificationUrl, custom_id: user.id },
        payment: {
          // O tipo da SDK declara customer.birth e billing_address como
          // obrigatórios, mas a API real aceita sem eles (confirmado
          // diretamente no sandbox) — daí o `any`.
          credit_card: {
            customer,
            payment_token,
            ...(isFirstTime ? { trial_days: TRIAL_DAYS } : {}),
          } as any,
        },
      }
    );

    const validUntil = new Date(
      Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    await supabaseAdmin
      .from('profiles')
      .update({
        cpf: customer.cpf,
        efi_payment_token: payment_token,
      })
      .eq('id', user.id);

    await supabaseAdmin.from('subscriptions').upsert(
      {
        user_id: user.id,
        efi_subscription_id: String(subscriptionResult.data.subscription_id),
        status: 'active',
        plan: 'pro',
        valid_until: validUntil,
        cancel_at_period_end: false,
      },
      { onConflict: 'user_id' }
    );

    if (isFirstTime && chargeId) {
      await supabaseAdmin.from('payments').insert({
        user_id: user.id,
        efi_charge_id: String(chargeId),
        amount: FIRST_MONTH_PRICE_CENTS / 100,
        status: 'completed',
        plan_type: 'monthly',
        payment_method: 'credit_card',
      });

      // A cobrança do 1º mês é registrada aqui mesmo (não passa pelo webhook,
      // que só trata cobrança nova), então o e-mail de compra sai daqui também.
      // O template de purchase_approved espera amount numérico (ele mesmo põe o R$).
      await notifyEmail({
        event: 'purchase_approved',
        email: user.email || null,
        name: profile.full_name || null,
        amount: FIRST_MONTH_PRICE_CENTS / 100,
        plan: 'PRO',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('EFI Checkout Error:', error);

    const message =
      error?.error_description || error?.error || error?.message ||
      'Erro interno ao processar pagamento';

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
