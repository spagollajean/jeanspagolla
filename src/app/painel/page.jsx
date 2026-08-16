'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Logo from '@/components/Logo';
import {
  Loader2, Mail, Lock, Eye, EyeOff, LogOut, ArrowRight,
  FileText, Download, CreditCard, AlertTriangle, ExternalLink, CheckCircle2,
} from 'lucide-react';

const VIORA_APP_URL = process.env.NEXT_PUBLIC_VIORA_APP_URL || 'https://app.jeanspagolla.com.br';

function friendlyError(msg) {
  const m = (msg || '').toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  return 'Erro: ' + msg;
}

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('pt-BR');
}

export default function PainelPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState(null);

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [account, setAccount] = useState(null);
  const [materials, setMaterials] = useState(null);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelMsg, setCancelMsg] = useState(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const loadAccount = useCallback(async (accessToken) => {
    setLoadingAccount(true);
    try {
      const [statusRes, materialsRes] = await Promise.all([
        fetch('/api/account/status', { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch('/api/account/materials', { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);
      const statusData = await statusRes.json();
      setAccount(statusData);
      if (materialsRes.ok) {
        const materialsData = await materialsRes.json();
        setMaterials(materialsData.materials || []);
      } else {
        setMaterials([]);
      }
    } catch (err) {
      console.error('Erro ao carregar conta:', err);
    } finally {
      setLoadingAccount(false);
    }
  }, []);

  useEffect(() => {
    if (session?.access_token) loadAccount(session.access_token);
  }, [session, loadAccount]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { data, error: loginErr } = await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      if (loginErr) throw loginErr;
      setSession(data.session);
    } catch (err) {
      setError(friendlyError(err?.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setAccount(null);
    setMaterials(null);
    setForm({ email: '', password: '' });
  };

  const handleCancel = async () => {
    if (!session?.access_token) return;
    if (!window.confirm('Tem certeza que quer cancelar sua assinatura? Você mantém o acesso até o fim do período já pago.')) return;
    setCanceling(true);
    setCancelMsg(null);
    try {
      const res = await fetch('/api/stripe/cancel', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao cancelar');
      setCancelMsg({ ok: true, text: data.message });
      await loadAccount(session.access_token);
    } catch (err) {
      setCancelMsg({ ok: false, text: err.message });
    } finally {
      setCanceling(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="checkout-page">
        <div className="checkout-loading"><Loader2 size={18} /> Carregando...</div>
      </div>
    );
  }

  // ── Não logado: formulário de login ─────────────────────────────────
  if (!session) {
    return (
      <div className="checkout-page">
        <div className="checkout-card">
          <div className="checkout-form-col" style={{ gridColumn: '1 / -1', maxWidth: 420, margin: '0 auto' }}>
            <Logo className="checkout-logo" />
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--bone)', marginBottom: '0.4rem' }}>
              Minha Área
            </h1>
            <p style={{ color: 'var(--bone-faint)', fontSize: '0.88rem', marginBottom: '1.6rem' }}>
              Entre com o mesmo e-mail e senha usados na assinatura.
            </p>

            {error && <div className="checkout-error">{error}</div>}

            <form onSubmit={handleLogin}>
              <div className="checkout-input-wrap">
                <Mail />
                <input
                  className="checkout-input"
                  type="email"
                  placeholder="E-mail"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="checkout-input-wrap">
                <Lock />
                <input
                  className="checkout-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Senha"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                />
                <button type="button" className="checkout-toggle-eye" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button type="submit" className="header-cta" style={{ width: '100%', justifyContent: 'center', marginTop: '0.6rem' }} disabled={submitting}>
                {submitting ? <Loader2 size={16} className="spin" /> : <>Entrar <ArrowRight size={16} /></>}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Logado: dashboard ───────────────────────────────────────────────
  return (
    <div className="checkout-page">
      <div className="checkout-card" style={{ gridTemplateColumns: '1fr' }}>
        <div className="checkout-form-col" style={{ minHeight: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.6rem' }}>
            <Logo className="checkout-logo" style={{ marginBottom: 0 }} />
            <button onClick={handleLogout} className="checkout-toggle-eye" style={{ position: 'static', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--bone-faint)' }}>
              <LogOut size={16} /> Sair
            </button>
          </div>

          {loadingAccount || !account ? (
            <div className="checkout-loading"><Loader2 size={18} /> Carregando sua conta...</div>
          ) : (
            <>
              {/* Plano */}
              <div className="checkout-price-row" style={{ marginTop: 0 }}>
                <div>
                  <div className="label">Seu plano</div>
                  <div className="value value--accent">{account.planLabel || 'Sem assinatura ativa'}</div>
                </div>
                {account.plan && (
                  <div style={{ textAlign: 'right' }}>
                    <div className="label">Válido até</div>
                    <div className="value" style={{ fontSize: '0.95rem' }}>{formatDate(account.validUntil)}</div>
                  </div>
                )}
              </div>

              {account.cancelAtPeriodEnd && (
                <div className="checkout-error" style={{ background: 'rgba(217,164,65,0.12)', borderColor: 'rgba(217,164,65,0.4)', color: '#D9A441', marginTop: '1rem' }}>
                  Sua assinatura foi cancelada e não será renovada. O acesso continua até {formatDate(account.validUntil)}.
                </div>
              )}

              {account.includesViora && (
                <button
                  type="button"
                  onClick={() => {
                    if (!session?.access_token || !session?.refresh_token) return;
                    const hash = new URLSearchParams({
                      access_token: session.access_token,
                      refresh_token: session.refresh_token,
                      next: '/dashboard',
                    }).toString();
                    window.location.href = `${VIORA_APP_URL}/auth/bridge#${hash}`;
                  }}
                  className="header-cta"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
                >
                  Acessar o Viora <ExternalLink size={16} />
                </button>
              )}

              {!account.plan && (
                <a href="/checkout" className="header-cta" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                  Assinar o Renascer <ArrowRight size={16} />
                </a>
              )}

              {/* Materiais */}
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--bone)', marginTop: '2rem', marginBottom: '0.8rem' }}>
                Materiais
              </h2>
              {!account.plan ? (
                <p style={{ color: 'var(--bone-faint)', fontSize: '0.85rem' }}>Disponível pra assinantes.</p>
              ) : materials === null ? (
                <div className="checkout-loading"><Loader2 size={16} /></div>
              ) : (
                <div style={{ display: 'grid', gap: '0.7rem' }}>
                  {materials.map((m) => (
                    <div key={m.id} className="checkout-price-row" style={{ marginTop: 0, alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                        <FileText size={18} color="var(--viora-emerald)" />
                        <div>
                          <div style={{ color: 'var(--bone)', fontSize: '0.88rem', fontWeight: 600 }}>{m.title}</div>
                          <div style={{ color: 'var(--bone-faint)', fontSize: '0.75rem' }}>{m.description}</div>
                        </div>
                      </div>
                      {m.url ? (
                        <a href={m.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--viora-emerald)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          <Download size={14} /> Baixar
                        </a>
                      ) : (
                        <span style={{ color: 'var(--bone-faint)', fontSize: '0.75rem' }}>Indisponível</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pagamentos */}
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--bone)', marginTop: '2rem', marginBottom: '0.8rem' }}>
                <CreditCard size={16} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: '-2px' }} />
                Pagamentos
              </h2>
              {account.payments.length === 0 ? (
                <p style={{ color: 'var(--bone-faint)', fontSize: '0.85rem' }}>Nenhum pagamento registrado ainda.</p>
              ) : (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {account.payments.map((p, i) => (
                    <div key={i} className="checkout-price-row" style={{ marginTop: 0, padding: '0.7rem 1rem' }}>
                      <div>
                        <div style={{ color: 'var(--bone)', fontSize: '0.82rem' }}>{formatDate(p.created_at)}</div>
                        <div style={{ color: 'var(--bone-faint)', fontSize: '0.72rem' }}>{p.payment_method === 'credit_card' ? 'Cartão de crédito' : p.payment_method}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="value" style={{ fontSize: '0.85rem' }}>R$ {Number(p.amount).toFixed(2).replace('.', ',')}</div>
                        <div style={{ fontSize: '0.7rem', color: p.status === 'completed' ? 'var(--viora-emerald)' : 'var(--bone-faint)' }}>
                          {p.status === 'completed' ? 'Pago' : p.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cancelamento */}
              {account.plan && !account.cancelAtPeriodEnd && (
                <div style={{ marginTop: '2.4rem', paddingTop: '1.4rem', borderTop: '1px solid var(--line-dark)' }}>
                  {cancelMsg && (
                    <div className={cancelMsg.ok ? 'checkout-error' : 'checkout-error'} style={cancelMsg.ok ? { background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)', color: 'var(--viora-emerald)' } : {}}>
                      {cancelMsg.ok ? <CheckCircle2 size={14} style={{ display: 'inline', marginRight: '0.3rem' }} /> : <AlertTriangle size={14} style={{ display: 'inline', marginRight: '0.3rem' }} />}
                      {cancelMsg.text}
                    </div>
                  )}
                  <button
                    onClick={handleCancel}
                    disabled={canceling}
                    style={{ background: 'none', border: '1px solid rgba(217,90,90,0.4)', color: '#E7A088', borderRadius: 'var(--radius)', padding: '0.7rem 1.2rem', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    {canceling ? <Loader2 size={14} className="spin" /> : 'Cancelar assinatura'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
