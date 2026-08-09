import { NextResponse } from 'next/server';
import { buildDiscordOAuthUrl } from '@/lib/discord';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/auth/discord/start?token=<supabase_access_token>
// O front manda o access_token da sessão atual como `state` pro callback
// saber pra qual conta gravar o discord_user_id (esse fluxo não tem
// cookie/sessão ambiente do lado do servidor).
export async function GET(req) {
  const token = new URL(req.url).searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Sessão ausente' }, { status: 401 });
  }
  return NextResponse.redirect(buildDiscordOAuthUrl(token));
}
