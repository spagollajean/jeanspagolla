import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Relay de link curto (ex: magic link do painel mandado por WhatsApp).
// Uso único -- apaga o registro assim que é consumido.
export async function GET(req, { params }) {
  const { slug } = await params;

  const { data, error } = await supabaseAdmin
    .from('link_redirects')
    .select('target_url, created_at')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.redirect(new URL('/painel', req.url));
  }

  supabaseAdmin.from('link_redirects').delete().eq('slug', slug).then(() => {});

  const ageMs = Date.now() - new Date(data.created_at).getTime();
  if (ageMs > 15 * 60 * 1000) {
    return NextResponse.redirect(new URL('/painel', req.url));
  }

  return NextResponse.redirect(data.target_url);
}
