'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { normalizePhone } from '@/lib/phone';
import { fbq, trackPurchase } from '@/lib/fbpixel';
import { gtag, gaPurchase } from '@/lib/ga';
import {
  Zap, ShieldCheck, Lock, Loader2, CheckCircle2, CreditCard, ArrowRight,
  Mail, Eye, EyeOff, MessageCircle, LogOut, User as UserIcon
} from 'lucide-react';

const EFI_SANDBOX = process.env.NEXT_PUBLIC_EFI_SANDBOX !== 'false';
const EFI_PAYEE_CODE = process.env.NEXT_PUBLIC_EFI_PAYEE_CODE || '';

// ── Formatters ──────────────────────────────────────────────────────────────
function formatPhone(v: string) {
  // Allow digits, plus sign and spaces for international format
  return v.replace(/[^\d+ ]/g, '');
}

function formatCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatCardNumber(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

// Validação real de CPF (dígitos verificadores), não só tamanho.
function isValidCPF(v: string) {
  const d = v.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  for (let t = 9; t < 11; t++) {
    let sum = 0;
    for (let i = 0; i < t; i++) sum += parseInt(d[i], 10) * (t + 1 - i);
    const digit = (sum * 10) % 11 % 10;
    if (digit !== parseInt(d[t], 10)) return false;
  }
  return true;
}

// Fallback local caso EfiPay.CreditCard.verifyCardBrand() falhe (ex: rede lenta).
function detectCardBrandLocal(number: string): string {
  if (/^4/.test(number)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(number)) return 'mastercard';
  if (/^3[47]/.test(number)) return 'amex';
  if (/^(4011|4312|4389|4514|4573|6277|6362|6363|650|6516|6550)/.test(number)) return 'elo';
  if (/^(606282|3841)/.test(number)) return 'hipercard';
  return 'unsupported';
}

const FEATURES = [
  'Análises de refeição ILIMITADAS via WhatsApp',
  'Coach pessoal com 7 personalidades de IA',
  'Avaliações físicas ILIMITADAS',
  'Plano de treino e dieta personalizado',
  'Histórico completo e gráficos de evolução',
];

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

// ── Friendly errors ─────────────────────────────────────────────────────────
function friendlyError(msg: string) {
  const m = (msg || '').toLowerCase();
  if (m.includes('already registered') || m.includes('user already registered')) return 'Este e-mail já está cadastrado. Use a opção de login.';
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (m.includes('password should be at least')) return 'Senha muito curta (mínimo 6 caracteres).';
  if (m.includes('duplicate key') || m.includes('profiles_phone')) return 'Esse número de WhatsApp já está em uso em outra conta.';
  if (m.includes('database error')) return 'Erro no servidor. Tente novamente.';
  return 'Erro: ' + msg;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading, refreshProfile } = useUser();

  const [step, setStep] = useState<'account' | 'payment'>('account');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');

  // ?method=pix (ex: CTA de pacotes Pix da /start) pré-seleciona a aba Pix
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('method') === 'pix') setPaymentMethod('pix');
  }, []);

  // Meta Pixel + GA4: entrou na tela de pagamento
  useEffect(() => {
    fbq('track', 'InitiateCheckout');
    gtag('event', 'begin_checkout', { currency: 'BRL' });
  }, []);

  // ── Form state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  // ── Dados de cobrança exigidos pela EFI (só cartão + CPF, ver [[efi-technical-notes]]) ──
  const [billing, setBilling] = useState({
    cpf: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardHolderName: '',
  });

  const setBillingField = (field: string, value: string) =>
    setBilling(b => ({ ...b, [field]: value }));

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'cpf') return setBillingField('cpf', formatCPF(value));
    if (name === 'cardNumber') return setBillingField('cardNumber', formatCardNumber(value));
    if (name === 'cardExpiry') {
      const d = value.replace(/\D/g, '').slice(0, 4);
      return setBillingField('cardExpiry', d.replace(/(\d{2})(\d)/, '$1/$2'));
    }
    if (name === 'cardCvv') return setBillingField('cardCvv', value.replace(/\D/g, '').slice(0, 4));
    setBillingField(name, value);
  };

  // Se já é PRO/trial, redireciona pro dashboard
  useEffect(() => {
    if (!loading && user) {
      if (user.plan === 'pro') {
        router.replace('/dashboard');
        return;
      }
      setStep('payment');
    }
  }, [user, loading, router]);

  // ── Google OAuth ──────────────────────────────────────────────────────────
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
    setStep('account');
  };

  // ── Field handlers ────────────────────────────────────────────────────────
  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      set('phone', formatPhone(value));
      return;
    }
    set(name, value);
  };

  // ── Step 1 handlers ───────────────────────────────────────────────────────
  const handleAccountNext = async () => {
    setError(null);
    try {
      if (!form.name.trim()) throw new Error('Informe seu nome completo.');
      if (!form.email.trim() || !form.email.includes('@')) throw new Error('Informe um e-mail válido.');
      const phoneDigits = normalizePhone(form.phone);
      if (phoneDigits.length < 10) throw new Error('Informe um número de WhatsApp válido com código do país e DDD.');
      if (form.password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');

      setSubmitting(true);

      // Confere e-mail/telefone duplicados agora — antes só travava no
      // passo de pagamento, depois do usuário já ter digitado cartão.
      const res = await fetch('/api/checkout/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, phone: phoneDigits }),
      });
      const result = await res.json();

      if (result.emailTaken) throw new Error('Este e-mail já está cadastrado. Use a opção de login.');
      if (result.phoneTaken) throw new Error('Esse número de WhatsApp já está em uso em outra conta.');

      setStep('payment');
    } catch (err: any) {
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

      await refreshProfile();
      setStep('payment');
    } catch (err: any) {
      setError(friendlyError(err?.message || 'Erro de login'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToAccount = () => {
    setError(null);
    setStep('account');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'account') {
      if (authMode === 'login') {
        await handleLoginSubmit();
      } else {
        await handleAccountNext();
      }
    } else {
      await handleSubmit(e);
    }
  };

  // ── Cria conta (se necessário) e devolve o access_token da sessão ──────────
  // Compartilhado entre o fluxo de cartão e o de Pix — ambos precisam de uma
  // conta autenticada antes de chamar qualquer rota /api/efi/*.
  const ensureAccount = async (): Promise<string> => {
    if (!user) {
      const phoneDigits = normalizePhone(form.phone);
      if (phoneDigits.length < 10) throw new Error('Informe um número de WhatsApp válido com código do país e DDD.');

      // UTMs da URL (vindos dos anúncios/landing) ficam no metadata do auth —
      // é o que permite cruzar campanha × assinante no painel Saas Master.
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
            ...(Object.keys(utm).length > 0 ? { signup_utm: utm } : {})
          }
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

      // Meta vinda do funil /start (?goal=Emagrecer etc.) → profiles.goal.
      // Falha aqui não pode travar o checkout: o bot pergunta de novo no WhatsApp.
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

    // Já logado (Google / Login por Email) — salva telefone se ainda não tem
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

  // ── Submit — cria conta se necessário, tokeniza o cartão e assina via EFI ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cpfDigits = billing.cpf.replace(/\D/g, '');
    const cardDigits = billing.cardNumber.replace(/\D/g, '');
    const [expMonth, expYear] = billing.cardExpiry.split('/');
    const holderName = billing.cardHolderName.trim();

    if (!isValidCPF(cpfDigits)) return setError(friendlyError('CPF inválido.'));
    if (cardDigits.length < 13 || !expMonth || !expYear || billing.cardCvv.length < 3) {
      return setError(friendlyError('Dados do cartão incompletos.'));
    }
    if (holderName.split(/\s+/).filter(Boolean).length < 2) {
      return setError(friendlyError('Informe o nome completo impresso no cartão.'));
    }

    setSubmitting(true);

    try {
      const sessionToken = await ensureAccount();

      // 2. Tokeniza o cartão no browser (o número/cvv nunca passam pelo nosso servidor)
      const EfiPay = (await import('payment-token-efi')).default;
      const detectedBrand = await EfiPay.CreditCard.setCardNumber(cardDigits).verifyCardBrand().catch(() => '');
      const brand = detectedBrand && !['unsupported', 'undefined', ''].includes(detectedBrand)
        ? detectedBrand
        : detectCardBrandLocal(cardDigits);

      if (brand === 'unsupported') {
        throw new Error('Bandeira do cartão não suportada.');
      }

      const tokenResult = await EfiPay.CreditCard
        .setAccount(EFI_PAYEE_CODE)
        .setEnvironment(EFI_SANDBOX ? 'sandbox' : 'production')
        .setCreditCardData({
          brand,
          number: cardDigits,
          cvv: billing.cardCvv,
          expirationMonth: expMonth,
          expirationYear: expYear.length === 2 ? `20${expYear}` : expYear,
          holderName,
          holderDocument: cpfDigits,
          reuse: true,
        })
        .getPaymentToken();

      if (!('payment_token' in tokenResult)) {
        throw new Error((tokenResult as any).error_description || 'Cartão recusado. Confira os dados e tente novamente.');
      }

      // 3. Chama a API de checkout da EFI (cobra R$5 e cria a assinatura)
      const res = await fetch('/api/efi/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          cpf: cpfDigits,
          phone: normalizePhone(user?.phone || form.phone),
          payment_token: tokenResult.payment_token,
          card_mask: tokenResult.card_mask,
        }),
      });

      const result = await res.json();
      if (result.error) throw new Error(result.error);

      // Meta Pixel + GA4: venda confirmada (cartão — R$5 do 1º mês)
      trackPurchase(5, { content_name: 'assinatura-cartao' });
      gaPurchase(5, 'assinatura-cartao');

      // Sem isso, o dashboard ainda vê user.plan === 'free' (contexto não
      // atualizado) e o paywall manda de volta pro /checkout.
      await refreshProfile();
      router.push('/dashboard');
    } catch (err: any) {
      setError(friendlyError(err?.message || 'Erro desconhecido'));
      setSubmitting(false);
    }
  };

  // ── Pix — pacotes avulsos (3/6/12 meses), sem recorrência ──────────────────
  // Preço por mês fixo (mais barato quanto maior o pacote) — desconto % é sempre
  // relativo ao R$14,99/mês do cartão, pra deixar a vantagem visível pro usuário.
  const PIX_PACKAGES: Record<string, { months: number; amount: number; perMonth: number; discountPct: number; label: string }> = {
    '3m': { months: 3, amount: 38.97, perMonth: 12.99, discountPct: 13, label: '3 meses' },
    '6m': { months: 6, amount: 71.94, perMonth: 11.99, discountPct: 20, label: '6 meses' },
    '12m': { months: 12, amount: 131.88, perMonth: 10.99, discountPct: 27, label: '12 meses' },
  };
  const [pixPackage, setPixPackage] = useState<'3m' | '6m' | '12m'>('3m');
  const [pixData, setPixData] = useState<{ txid: string; qrcode: string; imagemQrcode: string; amount: number; expiresInSeconds: number } | null>(null);
  const [pixTimeLeft, setPixTimeLeft] = useState(0);
  const [pixPaid, setPixPaid] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);

  const handleGeneratePix = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const sessionToken = await ensureAccount();

      const res = await fetch('/api/efi/pix/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
        body: JSON.stringify({ pkg: pixPackage }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      setPixData(result);
      setPixTimeLeft(result.expiresInSeconds);
      setPixPaid(false);
    } catch (err: any) {
      setError(friendlyError(err?.message || 'Erro ao gerar Pix'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyPixCode = () => {
    if (!pixData) return;
    navigator.clipboard.writeText(pixData.qrcode);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  // Countdown de expiração do QR Code
  useEffect(() => {
    if (!pixData || pixPaid || pixTimeLeft <= 0) return;
    const t = setTimeout(() => setPixTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [pixData, pixPaid, pixTimeLeft]);

  // Polling de confirmação de pagamento (a cada 4s, sem depender do webhook).
  // Não depende de pixTimeLeft de propósito — como ele muda a cada 1s, isso
  // recriava o interval a cada segundo e o setInterval(4000ms) nunca chegava
  // a disparar de verdade.
  useEffect(() => {
    if (!pixData || pixPaid) return;
    const interval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const res = await fetch('/api/efi/pix/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ txid: pixData.txid }),
        });
        const result = await res.json();
        if (result.paid) {
          setPixPaid(true);
          // Meta Pixel + GA4: venda confirmada (Pix — valor do pacote)
          trackPurchase(pixData.amount, { content_name: `pix-${pixPackage}` });
          gaPurchase(pixData.amount, `pix-${pixPackage}`);
          await refreshProfile();
          setTimeout(() => router.push('/dashboard'), 1500);
        }
      } catch {
        // tenta de novo no próximo tick
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [pixData, pixPaid, router]);

  // Usuário logado via Google sem telefone
  const googleUserNeedsPhone = !!user && !user.phone;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-2xl border border-gray-800">

        {/* ── LEFT: Plan Summary ───────────────────────────────────────── */}
        <div className="bg-gray-900 p-8 md:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-10">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <Zap size={16} fill="white" className="text-white" />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">Viora</span>
            </div>

            {step === 'payment' && paymentMethod === 'pix' ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-500/10 border border-brand-500/20 rounded-full mb-4">
                <Zap size={12} className="text-brand-400" fill="currentColor" />
                <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Pagamento único via Pix</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-500/10 border border-brand-500/20 rounded-full mb-4">
                <Zap size={12} className="text-brand-400" fill="currentColor" />
                <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">1º Mês por R$ 5,00</span>
              </div>
            )}

            <h1 className="text-2xl font-bold text-white mb-1">Plano PRO</h1>
            {step === 'payment' && paymentMethod === 'pix' ? (
              <p className="text-gray-400 text-sm mb-8">
                Acesso completo por <span className="text-white font-semibold">{PIX_PACKAGES[pixPackage].label}</span> com <span className="text-brand-400 font-semibold">{PIX_PACKAGES[pixPackage].discountPct}% de desconto</span>, sem renovação automática.
              </p>
            ) : (
              <p className="text-gray-400 text-sm mb-8">
                A partir do 2º mês, apenas <span className="text-white font-semibold">R$ 14,99/mês</span>. Cancele quando quiser.
              </p>
            )}

            <ul className="space-y-3 mb-8">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-gray-300">
                  <CheckCircle2 size={15} className="text-brand-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {step === 'payment' && paymentMethod === 'pix' ? (
              <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">Duração</p>
                  <p className="text-white font-bold text-lg">{PIX_PACKAGES[pixPackage].label}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">Hoje</p>
                  <p className="text-brand-400 font-bold text-lg">R$ {PIX_PACKAGES[pixPackage].amount.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">A partir do 2º mês</p>
                  <p className="text-white font-bold text-lg">R$ 14,99 <span className="text-gray-500 text-sm font-normal">/mês</span></p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">Hoje</p>
                  <p className="text-brand-400 font-bold text-lg">R$ 5,00</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-5 mt-8 pt-6 border-t border-gray-800">
            <div className="flex items-center gap-1.5 text-gray-600 text-xs"><Lock size={11} /><span>SSL 256-bit</span></div>
            <div className="flex items-center gap-1.5 text-gray-600 text-xs"><ShieldCheck size={11} /><span>PCI-DSS</span></div>
            <div className="flex items-center gap-1.5 text-gray-600 text-xs"><CreditCard size={11} /><span>Efí Pay</span></div>
          </div>
        </div>

        {/* ── RIGHT: Step-by-step Form ──────────────────────────────────── */}
        <div className="bg-gray-950 p-8 md:p-10 flex flex-col justify-center min-h-[480px]">

          {/* Error */}
          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-5">
            {step === 'account' ? (
              // ── STEP 1: CADASTRO / LOGIN ──
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-bold text-white">
                    {authMode === 'register' ? 'Crie sua conta' : 'Acesse sua conta'}
                  </h2>
                  <button type="button" onClick={() => { setAuthMode(m => m === 'login' ? 'register' : 'login'); setError(null); }} className="text-xs text-brand-400 hover:text-brand-300 font-semibold transition-colors">
                    {authMode === 'login' ? 'Criar nova conta' : 'Já tenho conta'}
                  </button>
                </div>

                {/* Google Button */}
                <button type="button" onClick={handleGoogleLogin} disabled={submitting}
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-60 text-sm">
                  <GoogleIcon />
                  Continuar com o Google
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-800" />
                  <span className="text-gray-600 text-xs">ou preencha os dados</span>
                  <div className="flex-1 h-px bg-gray-800" />
                </div>

                <div className="space-y-3">
                  {authMode === 'register' && (
                    <div className="relative">
                      <UserIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                      <input name="name" type="text" required value={form.name} onChange={handleChange}
                        placeholder="Nome completo"
                        className="w-full bg-gray-800 border border-gray-700 focus:border-brand-500 text-white placeholder-gray-600 rounded-lg px-4 py-2.5 pl-9 text-sm outline-none transition-colors" />
                    </div>
                  )}

                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input name="email" type="email" required value={form.email} onChange={handleChange}
                      placeholder="E-mail"
                      className="w-full bg-gray-800 border border-gray-700 focus:border-brand-500 text-white placeholder-gray-600 rounded-lg px-4 py-2.5 pl-9 text-sm outline-none transition-colors" />
                  </div>

                  {authMode === 'register' && (
                    <div className="relative">
                      <MessageCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" />
                      <input name="phone" type="tel" required value={form.phone} onChange={handleChange}
                        placeholder="WhatsApp (ex: +55 11 99999-9999 ou +44 79...)"
                        className="w-full bg-gray-800 border border-gray-700 focus:border-green-500 text-white placeholder-gray-600 rounded-lg px-4 py-2.5 pl-9 text-sm outline-none transition-colors" />
                    </div>
                  )}

                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input name="password" type={showPassword ? 'text' : 'password'} required value={form.password} onChange={handleChange}
                      placeholder="Senha (mínimo 6 caracteres)"
                      className="w-full bg-gray-800 border border-gray-700 focus:border-brand-500 text-white placeholder-gray-600 rounded-lg px-4 py-2.5 pl-9 pr-10 text-sm outline-none transition-colors" />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 text-sm">
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Processando...</>
                  ) : authMode === 'register' ? (
                    <>Continuar para o pagamento <ArrowRight size={16} /></>
                  ) : (
                    <>Entrar e continuar <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            ) : (
              // ── STEP 2: PAGAMENTO ──
              <div className="space-y-5 animate-in fade-in duration-300">
                {/* Identificação do Usuário */}
                <div className="flex items-center justify-between mb-2 border-b border-gray-800 pb-4">
                  <div>
                    {user ? (
                      <>
                        <p className="text-white font-semibold text-sm">Olá, {user.name.split(' ')[0]}! 👋</p>
                        <p className="text-gray-500 text-xs mt-0.5">{user.email}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-400 text-xs">Identificação:</p>
                        <p className="text-white font-semibold text-sm mt-0.5">{form.name}</p>
                        <p className="text-gray-500 text-xs">{form.email}</p>
                      </>
                    )}
                  </div>
                  <button type="button" onClick={handleLogout} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors">
                    <LogOut size={12} /> Trocar conta
                  </button>
                </div>

                {/* Se for Google User sem telefone */}
                {googleUserNeedsPhone && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-400">Vincular WhatsApp</label>
                    <div className="relative">
                      <MessageCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" />
                      <input name="phone" type="tel" required value={form.phone} onChange={handleChange}
                        placeholder="WhatsApp (ex: +55 11 99999-9999 ou +44 79...)"
                        className="w-full bg-gray-800 border border-gray-700 focus:border-green-500 text-white placeholder-gray-600 rounded-lg px-4 py-2.5 pl-9 text-sm outline-none transition-colors" />
                    </div>
                  </div>
                )}

                {/* Toggle Pix / Cartão */}
                <div className="flex bg-gray-800 border border-gray-700 rounded-xl p-1">
                  <button type="button" onClick={() => setPaymentMethod('card')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors ${paymentMethod === 'card' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                    <CreditCard size={14} /> Cartão
                  </button>
                  <button type="button" onClick={() => setPaymentMethod('pix')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors ${paymentMethod === 'pix' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                    <Zap size={14} /> Pix
                  </button>
                </div>

                {paymentMethod === 'card' ? (
                  <>
                    {/* Cartão de crédito */}
                    <div className="space-y-3">
                      <input name="cardNumber" type="text" required inputMode="numeric" value={billing.cardNumber} onChange={handleBillingChange}
                        placeholder="Número do cartão"
                        className="w-full bg-gray-800 border border-gray-700 focus:border-brand-500 text-white placeholder-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" />
                      <input name="cardHolderName" type="text" required value={billing.cardHolderName} onChange={handleBillingChange}
                        placeholder="Nome impresso no cartão"
                        className="w-full bg-gray-800 border border-gray-700 focus:border-brand-500 text-white placeholder-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" />
                      <div className="grid grid-cols-3 gap-3">
                        <input name="cardExpiry" type="text" required inputMode="numeric" value={billing.cardExpiry} onChange={handleBillingChange}
                          placeholder="MM/AA"
                          className="w-full bg-gray-800 border border-gray-700 focus:border-brand-500 text-white placeholder-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" />
                        <input name="cardCvv" type="text" required inputMode="numeric" value={billing.cardCvv} onChange={handleBillingChange}
                          placeholder="CVV"
                          className="w-full bg-gray-800 border border-gray-700 focus:border-brand-500 text-white placeholder-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" />
                        <input name="cpf" type="text" required value={billing.cpf} onChange={handleBillingChange}
                          placeholder="CPF"
                          className="w-full bg-gray-800 border border-gray-700 focus:border-brand-500 text-white placeholder-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" />
                      </div>
                      <p className="text-gray-500 text-[11px] flex items-center gap-1.5">
                        <ShieldCheck size={12} /> O número do cartão nunca passa pelos nossos servidores — criptografado direto no seu navegador.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Finalizar Assinatura</h3>
                        {!user && (
                          <button type="button" onClick={handleBackToAccount} className="text-xs text-brand-400 hover:text-brand-300 font-semibold transition-colors">
                            ← Alterar cadastro
                          </button>
                        )}
                      </div>

                      <p className="text-gray-400 text-xs leading-normal">
                        Valor cobrado hoje: <span className="text-brand-400 font-bold">R$ 5,00</span>.<br />
                        Renovação automática no próximo mês por <span className="text-white font-semibold">R$ 14,99/mês</span>. Cancele com um clique quando quiser.
                      </p>
                    </div>

                    <button type="submit" disabled={submitting}
                      className="w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 text-base">
                      {submitting ? (
                        <><Loader2 size={18} className="animate-spin" /> Processando pagamento...</>
                      ) : (
                        <><Lock size={16} /> Confirmar Assinatura <ArrowRight size={18} /></>
                      )}
                    </button>

                    <p className="text-center text-gray-500 text-[11px] leading-relaxed">
                      Ao clicar em "Confirmar Assinatura" você concorda com nossos Termos de Uso e Política de Privacidade.
                    </p>
                  </>
                ) : (
                  <>
                    {/* Pix — pacotes avulsos, sem recorrência */}
                    {!pixData ? (
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Escolha o pacote</h3>
                        <div className="grid grid-cols-3 gap-2">
                          {(['3m', '6m', '12m'] as const).map((key) => { const pkg = PIX_PACKAGES[key]; return (
                            <button key={key} type="button" onClick={() => setPixPackage(key)}
                              className={`relative rounded-xl border p-3 text-center transition-colors ${pixPackage === key ? 'border-brand-500 bg-brand-500/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`}>
                              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                -{pkg.discountPct}%
                              </span>
                              <p className="text-white font-bold text-sm mt-1">{pkg.label}</p>
                              <p className="text-brand-400 font-bold text-lg mt-1">R$ {pkg.perMonth.toFixed(2).replace('.', ',')}<span className="text-gray-500 text-xs font-normal">/mês</span></p>
                              <p className="text-gray-500 text-[11px] mt-0.5">R$ {pkg.amount.toFixed(2).replace('.', ',')} total</p>
                            </button>
                          ); })}
                        </div>
                        <p className="text-gray-400 text-xs leading-normal">
                          Pagamento único via Pix — sem renovação automática. O acesso PRO fica valendo pelo período escolhido.
                        </p>
                        <button type="button" onClick={handleGeneratePix} disabled={submitting}
                          className="w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 text-base">
                          {submitting ? (
                            <><Loader2 size={18} className="animate-spin" /> Gerando Pix...</>
                          ) : (
                            <><Zap size={16} /> Gerar Pix <ArrowRight size={18} /></>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4 text-center">
                        {pixPaid ? (
                          <div className="py-6 space-y-2">
                            <CheckCircle2 size={40} className="text-brand-500 mx-auto" />
                            <p className="text-white font-bold">Pagamento confirmado!</p>
                            <p className="text-gray-400 text-xs">Redirecionando pro seu painel...</p>
                          </div>
                        ) : (
                          <>
                            <img src={pixData.imagemQrcode} alt="QR Code Pix" className="w-48 h-48 mx-auto rounded-lg bg-white p-2" />
                            <p className="text-white font-bold text-sm">R$ {pixData.amount.toFixed(2).replace('.', ',')}</p>
                            <div className="flex items-center gap-2">
                              <input readOnly value={pixData.qrcode}
                                className="flex-1 bg-gray-800 border border-gray-700 text-gray-400 rounded-lg px-3 py-2 text-[11px] truncate outline-none" />
                              <button type="button" onClick={handleCopyPixCode}
                                className="shrink-0 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
                                {pixCopied ? 'Copiado!' : 'Copiar'}
                              </button>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
                              {pixTimeLeft > 0 ? (
                                <>
                                  <Loader2 size={12} className="animate-spin" />
                                  Aguardando pagamento — expira em {Math.floor(pixTimeLeft / 60)}:{String(pixTimeLeft % 60).padStart(2, '0')}
                                </>
                              ) : (
                                <span className="text-red-400">QR Code expirado.</span>
                              )}
                            </div>
                            {pixTimeLeft <= 0 && (
                              <button type="button" onClick={() => setPixData(null)}
                                className="w-full py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold rounded-xl transition-colors text-sm">
                                Gerar novo Pix
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </form>
        </div>

      </div>
    </div>
  );
}
