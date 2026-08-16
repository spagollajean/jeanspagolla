'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

// Servidor exclusivo (sem convite público): a pessoa já foi adicionada
// direto pelo callback do OAuth, então isso é só um atalho pra abrir o
// servidor onde ela já está -- não um link de convite.
const DISCORD_SERVER_URL = 'https://discord.com/channels/1536093719227531286';
const VIORA_APP_URL = process.env.NEXT_PUBLIC_VIORA_APP_URL || 'https://app.jeanspagolla.com.br';

function DiscordConnectInner() {
  const params = useSearchParams();
  const status = params.get('status');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'session-expired') {
      setError('Sua sessão expirou. Faça login de novo pra reconectar o Discord.');
    } else if (status === 'error') {
      setError('Não deu pra conectar o Discord agora. Tente de novo.');
    }
  }, [status]);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setError('Faça login primeiro pra conectar o Discord.');
      setConnecting(false);
      return;
    }
    window.location.href = `/api/auth/discord/start?token=${encodeURIComponent(session.access_token)}`;
  };

  if (status === 'success') {
    const goToViora = params.get('next') === 'viora';

    const handleOpenViora = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token || !session?.refresh_token) {
        window.location.href = `${VIORA_APP_URL}/dashboard`;
        return;
      }
      const hash = new URLSearchParams({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        next: '/dashboard',
      }).toString();
      window.location.href = `${VIORA_APP_URL}/auth/bridge#${hash}`;
    };

    return (
      <div className="checkout-page">
        <div className="checkout-card" style={{ gridTemplateColumns: '1fr' }}>
          <div className="checkout-form-col" style={{ textAlign: 'center' }}>
            <CheckCircle2 size={40} style={{ color: 'var(--viora-emerald)', margin: '0 auto 1rem' }} />
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--bone)' }}>Discord conectado!</h1>
            <p style={{ color: 'var(--bone-soft)', fontSize: '0.92rem', marginTop: '0.6rem' }}>
              Você já foi adicionado ao servidor automaticamente — não precisa de convite.
            </p>
            <a href={DISCORD_SERVER_URL} target="_blank" rel="noopener noreferrer" className="btn btn--viora btn--block" style={{ marginTop: '1.4rem' }}>
              Abrir o servidor
            </a>
            {goToViora && (
              <button type="button" onClick={handleOpenViora} className="btn btn--outline btn--block" style={{ marginTop: '0.8rem' }}>
                Acessar o Viora
              </button>
            )}
            <a href="/painel" style={{ color: 'var(--bone-faint)', fontSize: '0.8rem', display: 'inline-block', marginTop: '1rem' }}>
              Ir pra Minha Área
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-card" style={{ gridTemplateColumns: '1fr' }}>
        <div className="checkout-form-col" style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--bone)' }}>Conecte seu Discord</h1>
          <p style={{ color: 'var(--bone-soft)', fontSize: '0.92rem', marginTop: '0.6rem' }}>
            Falta só isso pra liberar seu acesso à comunidade — conecta sua conta do Discord pra gente te dar o cargo de assinante automaticamente.
          </p>

          <div style={{ background: 'var(--dark-2)', border: '1px solid var(--line-dark)', borderRadius: 'var(--radius)', padding: '0.9rem 1.1rem', marginTop: '1.2rem', textAlign: 'left' }}>
            <p style={{ color: 'var(--bone-faint)', fontSize: '0.8rem', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--bone-soft)' }}>Ainda não tem conta no Discord?</strong> Crie uma primeiro (com e-mail ou telefone verificado) e depois volte pra essa página.
            </p>
            <a href="https://discord.com/register" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--viora-emerald)', fontSize: '0.82rem', fontWeight: 600, display: 'inline-block', marginTop: '0.4rem' }}>
              Criar conta no Discord →
            </a>
          </div>

          {error && <div className="checkout-error" style={{ marginTop: '1.2rem' }}>{error}</div>}

          <button type="button" onClick={handleConnect} disabled={connecting} className="btn btn--viora btn--block" style={{ marginTop: '1.4rem' }}>
            {connecting ? <><Loader2 size={16} className="checkout-loading" style={{ padding: 0 }} /> Redirecionando...</> : 'Conectar Discord'}
          </button>

          <a href="/painel" style={{ color: 'var(--bone-faint)', fontSize: '0.8rem', display: 'inline-block', marginTop: '1rem' }}>
            Prefiro fazer isso depois, ir pra Minha Área
          </a>
        </div>
      </div>
    </div>
  );
}

export default function DiscordConnectPage() {
  return (
    <Suspense fallback={<div className="checkout-page"><div className="checkout-loading"><Loader2 size={18} /> Carregando...</div></div>}>
      <DiscordConnectInner />
    </Suspense>
  );
}
