'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

// Ponte de sessão entre jeanspagolla.com.br/painel e app.jeanspagolla.com.br.
// São dois apps/domínios diferentes -- não compartilham localStorage --
// então o painel manda os tokens pela URL (fragment, nunca chega ao
// servidor) e essa página só troca isso por uma sessão local do Viora.
export default function AuthBridgePage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
    const params = new URLSearchParams(hash);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const next = params.get('next') || '/dashboard';

    if (!access_token || !refresh_token) {
      setError(true);
      return;
    }

    supabase.auth.setSession({ access_token, refresh_token }).then(({ error: sessionError }) => {
      if (sessionError) {
        console.error('Falha ao aplicar sessão:', sessionError);
        setError(true);
        return;
      }
      router.replace(next);
    });
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.8rem' }}>
      {error ? (
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Link expirado ou inválido. Volte pro WhatsApp e tente de novo.</p>
      ) : (
        <>
          <Loader2 className="animate-spin" size={28} />
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Entrando...</p>
        </>
      )}
    </div>
  );
}
