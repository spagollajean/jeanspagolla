'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

const DISCORD_INVITE_URL = 'https://discord.gg/wDMScm5Zpg';
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
    return (
      <div className="checkout-page">
        <div className="checkout-card" style={{ gridTemplateColumns: '1fr' }}>
          <div className="checkout-form-col" style={{ textAlign: 'center' }}>
            <CheckCircle2 size={40} style={{ color: 'var(--viora-emerald)', margin: '0 auto 1rem' }} />
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--bone)' }}>Discord conectado!</h1>
            <p style={{ color: 'var(--bone-soft)', fontSize: '0.92rem', marginTop: '0.6rem' }}>
              Seu acesso à comunidade já está liberado. Entra no servidor:
            </p>
            <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="btn btn--viora btn--block" style={{ marginTop: '1.4rem' }}>
              Entrar no Discord
            </a>
            {goToViora && (
              <a href={`${VIORA_APP_URL}/dashboard`} className="btn btn--outline btn--block" style={{ marginTop: '0.8rem' }}>
                Acessar o Viora
              </a>
            )}
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
          {error && <div className="checkout-error" style={{ marginTop: '1.2rem' }}>{error}</div>}
          <button type="button" onClick={handleConnect} disabled={connecting} className="btn btn--viora btn--block" style={{ marginTop: '1.4rem' }}>
            {connecting ? <><Loader2 size={16} className="checkout-loading" style={{ padding: 0 }} /> Redirecionando...</> : 'Conectar Discord'}
          </button>
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
