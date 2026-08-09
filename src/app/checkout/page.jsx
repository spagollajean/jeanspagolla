'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { normalizePhone } from '@/lib/phone';
import { fbq, trackPurchase } from '@/lib/fbpixel';
import { gtag, gaPurchase } from '@/lib/ga';
import StripeCheckout from '@/components/StripeCheckout';
import {
  ShieldCheck, Lock, Loader2, CheckCircle2, ArrowRight,
  Mail, Eye, EyeOff, MessageCircle, LogOut, User as UserIcon,
} from 'lucide-react';

const VIORA_APP_URL = process.env.NEXT_PUBLIC_VIORA_APP_URL || 'https://app.jeanspagolla.com.br';

const PLAN_INFO = {
  essencial: {
    key: 'essencial',
    label: 'Renascer Essencial',
    priceLabel: 'R$ 59,90',
    includesViora: false,
    tagline: 'Menos que uma única sessão avulsa de personal trainer.',
    features: [
      'Aulas em vídeo com todos os protocolos',
      'Comunidade no Skool com acesso a mim',
      'Desafios, palestras e aulas ao vivo',
    ],
  },
  completo: {
    key: 'completo',
    label: 'Renascer Completo',
    priceLabel: 'R$ 79,90',
    includesViora: true,
    tagline: 'Cobrança diária comigo e com o Viora, direto no seu WhatsApp.',
    features: [
      'Tudo do Renascer Essencial',
      'APP Viora AI direto no WhatsApp',
      'Leitura de pratos por foto e calculadora metabólica Viora',
      'Menor chance de se perder no caminho',
    ],
  },
};

function formatPhone(v) {
  return v.replace(/[^\d+ ]/g, '');
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

function friendlyError(msg) {
  const m = (msg || '').toLowerCase();
  if (m.includes('already registered') || m.includes('user already registered')) return 'Este e-mail já está cadastrado. Use a opção de login.';
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (m.includes('password should be at least')) return 'Senha muito curta (mínimo 6 caracteres).';
  if (m.includes('duplicate key') || m.includes('profiles_phone')) return 'Esse número de WhatsApp já está em uso em outra conta.';
  if (m.includes('database error')) return 'Erro no servidor. Tente novamente.';
  return 'Erro: ' + msg;
}

export default function CheckoutPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [selectedPlan, setSelectedPlan] = useState('completo');
  const [step, setStep] = useState('account'); // account | payment | already-subscribed | success
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState('register');
  const [sessionToken, setSessionToken] = useState(null);

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });

  const plan = PLAN_INFO[selectedPlan];

  // Lê o plano da URL (?plan=essencial|completo), vindo dos CTAs da landing.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('plan');
    if (p === 'essencial' || p === 'completo') setSelectedPlan(p);
  }, []);

  const fetchProfile = useCallback(async (userId, email) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, subscriptions(*)')
      .eq('id', userId)
      .maybeSingle();

    const sub = profile?.subscriptions;
    const entitlement = Array.isArray(sub) ? sub[0] : sub;
    const isActive = !!entitlement &&
      entitlement.status === 'active' &&
      (!entitlement.valid_until || new Date(entitlement.valid_until) > new Date());

    const userData = {
      id: userId,
      name: profile?.full_name || 'Usuário',
      email: email || profile?.email || '',
      phone: profile?.phone || '',
      plan: isActive ? entitlement.plan : null,
    };
    setUser(userData);
    return userData;
  }, []);

  // Meta Pixel + GA4: entrou na tela de pagamento
  useEffect(() => {
    fbq('track', 'InitiateCheckout');
    gtag('event', 'begin_checkout', { currency: 'BRL' });
  }, []);

  // Sessão inicial: se já é assinante, não deixa comprar de novo.
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        const userData = await fetchProfile(session.user.id, session.user.email);
        if (userData.plan === 'completo') {
          window.location.href = `${VIORA_APP_URL}/dashboard`;
          return;
        }
        if (userData.plan === 'essencial') {
          setStep('already-subscribed');
          if (mounted) setAuthLoading(false);
          return;
        }
        setStep('payment');
      }
      if (mounted) setAuthLoading(false);
    });
    return () => { mounted = false; };
  }, [fetchProfile]);

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/checkout' },
    });
    if (error) {
      setError(friendlyError(error.message));
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setForm({ name: '', email: '', phone: '', password: '' });
    setError(null);
    setSessionToken(null);
    setUser(null);
    setStep('account');
  };

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      set('phone', formatPhone(value));
      return;
    }
    set(name, value);
  };

  const ensureAccount = async () => {
    if (!user) {
      const phoneDigits = normalizePhone(form.phone);
      if (phoneDigits.length < 10) throw new Error('Informe um número de WhatsApp válido com código do país e DDD.');

      const utm = Object.fromEntries(
        Array.from(new URLSearchParams(window.location.search))
          .filter(([k]) => k.startsWith('utm_') || k === 'goal')
      );

      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: {
            full_name: form.name.trim(),
            phone: phoneDigits,
            ...(Object.keys(utm).length > 0 ? { signup_utm: utm } : {}),
          },
        },
      });
      if (signUpErr) throw signUpErr;
      if (!data.user || !data.session) throw new Error('Erro ao criar conta. Tente novamente.');

      const { error: rpcErr } = await supabase.rpc('register_user_profile', {
        p_full_name: form.name.trim(),
        p_phone: phoneDigits,
        p_email: form.email.trim().toLowerCase(),
      });
      if (rpcErr) throw rpcErr;

      try {
        const goalParam = new URLSearchParams(window.location.search).get('goal') || '';
        const goal = /emagrecer/i.test(goalParam) ? 'emagrecer'
          : /massa/i.test(goalParam) ? 'ganhar_massa'
          : /comer|melhor|manter|sa[uú]de/i.test(goalParam) ? 'manter'
          : null;
        if (goal) await supabase.from('profiles').update({ goal }).eq('id', data.user.id);
      } catch { /* segue o fluxo */ }

      return data.session.access_token;
    }

    const phoneDigits = normalizePhone(form.phone);
    if (!user.phone) {
      if (phoneDigits.length < 10) throw new Error('Informe um número de WhatsApp válido com código do país e DDD.');
      const { error: rpcErr } = await supabase.rpc('register_user_profile', {
        p_full_name: user.name,
        p_phone: phoneDigits,
        p_email: user.email,
      });
      if (rpcErr) throw rpcErr;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Sessão inválida. Faça login novamente.');
    return session.access_token;
  };

  const handleAccountNext = async () => {
    setError(null);
    try {
      if (!form.name.trim()) throw new Error('Informe seu nome completo.');
      if (!form.email.trim() || !form.email.includes('@')) throw new Error('Informe um e-mail válido.');
      const phoneDigits = normalizePhone(form.phone);
      if (phoneDigits.length < 10) throw new Error('Informe um número de WhatsApp válido com código do país e DDD.');
      if (form.password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');

      setSubmitting(true);

      const res = await fetch('/api/checkout/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, phone: phoneDigits }),
      });
      const result = await res.json();

      if (result.emailTaken) throw new Error('Este e-mail já está cadastrado. Use a opção de login.');
      if (result.phoneTaken) throw new Error('Esse número de WhatsApp já está em uso em outra conta.');

      const token = await ensureAccount();
      setSessionToken(token);
      setStep('payment');
    } catch (err) {
      setError(friendlyError(err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { data, error: loginErr } = await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      if (loginErr) throw loginErr;
      if (!data.user || !data.session) throw new Error('Erro ao fazer login. Tente novamente.');

      const userData = await fetchProfile(data.user.id, data.user.email);
      if (userData.plan === 'completo') {
        window.location.href = `${VIORA_APP_URL}/dashboard`;
        return;
      }
      if (userData.plan === 'essencial') {
        setStep('already-subscribed');
        return;
      }
      setSessionToken(data.session.access_token);
      setStep('payment');
    } catch (err) {
      setError(friendlyError(err?.message || 'Erro de login'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToAccount = () => {
    setError(null);
    setSessionToken(null);
    setStep('account');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (authMode === 'login') {
      await handleLoginSubmit();
    } else {
      await handleAccountNext();
    }
  };

  useEffect(() => {
    if (step === 'payment' && !sessionToken) {
      ensureAccount()
        .then(setSessionToken)
        .catch((err) => setError(friendlyError(err?.message || 'Sessão inválida')));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const googleUserNeedsPhone = !!user && !user.phone;

  if (authLoading) {
    return (
      <div className="checkout-page">
        <div className="checkout-loading"><Loader2 size={18} /> Carregando...</div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-card">
        {/* ── LEFT: Plan Summary ───────────────────────────────────────── */}
        <div className="checkout-summary">
          <div>
            <div className="checkout-logo">Renascer</div>

            {step !== 'already-subscribed' && (
              <div className="checkout-plan-toggle">
                {Object.values(PLAN_INFO).map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setSelectedPlan(p.key)}
                    disabled={step === 'payment'}
                    className={`checkout-plan-toggle__btn ${selectedPlan === p.key ? 'active' : ''}`}
                  >
                    {p.key === 'completo' ? 'Completo + Viora' : 'Essencial'}
                  </button>
                ))}
              </div>
            )}

            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.7rem', color: 'var(--bone)', marginTop: '1rem' }}>{plan.label}</h1>
            <p style={{ color: 'var(--bone-soft)', fontSize: '0.92rem', marginTop: '0.4rem' }}>{plan.tagline}</p>

            <ul className="checkout-features">
              {plan.features.map((f) => (
                <li key={f}>
                  <CheckCircle2 />
                  {f}
                </li>
              ))}
            </ul>

            <div className="checkout-price-row">
              <div>
                <div className="label">Cobrança mensal</div>
                <div className="value value--accent">{plan.priceLabel}<small style={{ fontSize: '0.7rem', color: 'var(--bone-faint)' }}>/mês</small></div>
              </div>
            </div>
          </div>

          <div className="checkout-trust">
            <span><Lock size={12} /> SSL 256-bit</span>
            <span><ShieldCheck size={12} /> PCI-DSS</span>
            <span>Stripe</span>
          </div>
        </div>

        {/* ── RIGHT: Step-by-step Form ──────────────────────────────────── */}
        <div className="checkout-form-col">
          {error && <div className="checkout-error">{error}</div>}

          {step === 'already-subscribed' ? (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle2 size={40} style={{ color: 'var(--viora-emerald)', margin: '0 auto 1rem' }} />
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--bone)' }}>Você já é aluno do Renascer Essencial</h2>
              <p style={{ color: 'var(--bone-soft)', fontSize: '0.9rem', marginTop: '0.6rem' }}>
                Sua assinatura está ativa. Quer destravar o Viola AI no WhatsApp com o plano Completo?
              </p>
              <button
                type="button"
                onClick={() => { setSelectedPlan('completo'); setStep('account'); }}
                className="btn btn--viora btn--block"
                style={{ marginTop: '1.4rem' }}
              >
                Fazer upgrade para o Completo <ArrowRight size={16} />
              </button>
            </div>
          ) : step === 'account' ? (
            <form onSubmit={handleFormSubmit}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--bone)' }}>
                  {authMode === 'register' ? 'Crie sua conta' : 'Acesse sua conta'}
                </h2>
                <button type="button" onClick={() => { setAuthMode((m) => (m === 'login' ? 'register' : 'login')); setError(null); }}
                  style={{ fontSize: '0.78rem', color: 'var(--viora-emerald)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                  {authMode === 'login' ? 'Criar nova conta' : 'Já tenho conta'}
                </button>
              </div>

              <button type="button" onClick={handleGoogleLogin} disabled={submitting} className="btn btn--outline btn--block"
                style={{ background: 'var(--bone)', color: 'var(--ink)', gap: '0.6rem', marginBottom: '1rem' }}>
                <GoogleIcon />
                Continuar com o Google
              </button>

              <div className="checkout-divider"><span>ou preencha os dados</span></div>

              {authMode === 'register' && (
                <div className="checkout-input-wrap">
                  <UserIcon />
                  <input name="name" type="text" required value={form.name} onChange={handleChange}
                    placeholder="Nome completo" className="checkout-input" />
                </div>
              )}

              <div className="checkout-input-wrap">
                <Mail />
                <input name="email" type="email" required value={form.email} onChange={handleChange}
                  placeholder="E-mail" className="checkout-input" />
              </div>

              {authMode === 'register' && (
                <div className="checkout-input-wrap">
                  <MessageCircle style={{ color: 'var(--viora-emerald)' }} />
                  <input name="phone" type="tel" required value={form.phone} onChange={handleChange}
                    placeholder="WhatsApp (ex: +55 11 99999-9999)" className="checkout-input" />
                </div>
              )}

              <div className="checkout-input-wrap">
                <Lock />
                <input name="password" type={showPassword ? 'text' : 'password'} required value={form.password} onChange={handleChange}
                  placeholder="Senha (mínimo 6 caracteres)" className="checkout-input" style={{ paddingRight: '2.4rem' }} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="checkout-toggle-eye">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <button type="submit" disabled={submitting} className="btn btn--viora btn--block" style={{ marginTop: '0.6rem' }}>
                {submitting ? (
                  <><Loader2 size={16} className="checkout-loading" style={{ padding: 0 }} /> Processando...</>
                ) : authMode === 'register' ? (
                  <>Continuar para o pagamento <ArrowRight size={16} /></>
                ) : (
                  <>Entrar e continuar <ArrowRight size={16} /></>
                )}
              </button>

              <p style={{ fontSize: '0.72rem', color: 'var(--bone-faint)', textAlign: 'center', marginTop: '0.9rem' }}>
                Ao continuar, você concorda com os{' '}
                <a href="/termos" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--bone-soft)', textDecoration: 'underline' }}>Termos de Uso</a>
                {' '}e a{' '}
                <a href="/privacidade" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--bone-soft)', textDecoration: 'underline' }}>Política de Privacidade</a>.
              </p>
            </form>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--line-dark)', paddingBottom: '1rem' }}>
                <div>
                  {user ? (
                    <>
                      <p style={{ color: 'var(--bone)', fontWeight: 600, fontSize: '0.9rem' }}>Olá, {user.name.split(' ')[0]}! 👋</p>
                      <p style={{ color: 'var(--bone-faint)', fontSize: '0.78rem', marginTop: '0.2rem' }}>{user.email}</p>
                    </>
                  ) : (
                    <>
                      <p style={{ color: 'var(--bone-faint)', fontSize: '0.78rem' }}>Identificação:</p>
                      <p style={{ color: 'var(--bone)', fontWeight: 600, fontSize: '0.9rem', marginTop: '0.2rem' }}>{form.name}</p>
                      <p style={{ color: 'var(--bone-faint)', fontSize: '0.78rem' }}>{form.email}</p>
                    </>
                  )}
                </div>
                <button type="button" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', color: 'var(--bone-faint)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <LogOut size={12} /> Trocar conta
                </button>
              </div>

              {googleUserNeedsPhone && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--bone-soft)', marginBottom: '0.4rem' }}>Vincular WhatsApp</label>
                  <div className="checkout-input-wrap">
                    <MessageCircle style={{ color: 'var(--viora-emerald)' }} />
                    <input name="phone" type="tel" required value={form.phone} onChange={handleChange}
                      placeholder="WhatsApp (ex: +55 11 99999-9999)" className="checkout-input" />
                  </div>
                </div>
              )}

              {!user && (
                <button type="button" onClick={handleBackToAccount} style={{ fontSize: '0.78rem', color: 'var(--viora-emerald)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1rem' }}>
                  ← Alterar cadastro
                </button>
              )}

              {sessionToken ? (
                <StripeCheckout
                  key={`${sessionToken}-${selectedPlan}`}
                  sessionToken={sessionToken}
                  plan={selectedPlan}
                  onComplete={async () => {
                    trackPurchase(plan.key === 'essencial' ? 59.90 : 79.90, { content_name: plan.label });
                    gaPurchase(plan.key === 'essencial' ? 59.90 : 79.90, plan.label);
                    // A ativacao real (subscriptions.status) vem do webhook do
                    // Stripe, que roda em paralelo -- espera um instante antes
                    // de seguir. Todo mundo passa por conectar o Discord (e o
                    // que libera o acesso a comunidade) antes de continuar.
                    await new Promise((r) => setTimeout(r, 2500));
                    window.location.href = `/discord-connect${plan.includesViora ? '?next=viora' : ''}`;
                  }}
                />
              ) : (
                <div className="checkout-loading"><Loader2 size={16} /> Preparando pagamento...</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
