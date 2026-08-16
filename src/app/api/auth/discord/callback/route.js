import { NextResponse } from 'next/server';
import { exchangeCodeForDiscordUser, addMemberToGuild } from '@/lib/discord';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAIN_SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jeanspagolla.com.br';

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // access_token do Supabase

  if (!code || !state) {
    return NextResponse.redirect(`${MAIN_SITE}/discord-connect?status=error`);
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(state);
    if (authError || !user) {
      return NextResponse.redirect(`${MAIN_SITE}/discord-connect?status=session-expired`);
    }

    const discordUser = await exchangeCodeForDiscordUser(code);

    await supabaseAdmin
      .from('profiles')
      .update({ discord_user_id: discordUser.id })
      .eq('id', user.id);

    // Servidor exclusivo: sem link de convite público -- a pessoa só entra
    // no servidor através deste fluxo, no momento em que conecta a conta.
    // Se já tem assinatura ativa (pagou antes de conectar), entra com o
    // cargo de assinante na hora. Se ainda não pagou, entra sem cargo (ou
    // nem entra ainda -- o webhook da Stripe adiciona o cargo depois, mas
    // sem um novo OAuth token não dá pra re-adicionar ao servidor).
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('status, valid_until')
      .eq('user_id', user.id)
      .maybeSingle();

    const isActive = subscription?.status === 'active' &&
      (!subscription.valid_until || new Date(subscription.valid_until) > new Date());

    await addMemberToGuild(discordUser.id, discordUser._oauthAccessToken, isActive);

    return NextResponse.redirect(`${MAIN_SITE}/discord-connect?status=success`);
  } catch (error) {
    console.error('Discord OAuth callback error:', error);
    return NextResponse.redirect(`${MAIN_SITE}/discord-connect?status=error`);
  }
}
