'use client';

/**
 * Landing de conversão clássica (/lp) — tráfego pago/frio.
 * Visual dark + neon (feedback do Marcio em 16/07: a v1 clean era "simples
 * demais pra tráfego frio"). Prova em 2 níveis: os cards REAIS do produto
 * (public/lp/) + telas de evolução/treino/dieta construídas em JSX (mesma
 * técnica do mockup de celular do Hero da home) com aviso de ilustração.
 * Copy continua "direto ao ponto e sem lorota": nada de depoimento inventado
 * nem contador fake.
 *
 * Oferta de lançamento (Marcio, 16/07): R$ 5 no 1º mês, R$ 14,99/mês travado
 * por 1 ano pra quem assinar agora; depois do lançamento vai a R$ 29,90/mês.
 */

import React, { useEffect } from 'react';
import Image from 'next/image';
import { fbq } from '@/lib/fbpixel';
import { gtag } from '@/lib/ga';
import { MAIN_SITE_URL } from '@/lib/site';
import {
  Camera, Zap, TrendingUp, TrendingDown, Check, ArrowRight, ShieldCheck,
  MessageCircle, FileText, Scan, Flame, Dumbbell, Salad, Activity,
  Sparkles, ChevronRight,
} from 'lucide-react';

const CHECKOUT = `${MAIN_SITE_URL}/checkout?utm_source=lp-classic`;

// ── Botão CTA principal (verde neon com glow) ────────────────────────────────
function CtaButton({ onClick, children, big = false }: { onClick: () => void; children: React.ReactNode; big?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-500 via-emerald-400 to-brand-500 text-gray-950 font-extrabold shadow-glow transition-all hover:-translate-y-0.5 hover:shadow-[0_0_60px_rgba(16,185,129,0.45)] ${big ? 'w-full sm:w-auto px-12 py-5 text-xl' : 'w-full sm:w-auto px-9 py-4 text-lg'}`}
      style={{ backgroundSize: '200% 200%' }}
    >
      <span className="relative flex items-center gap-2">
        {children}
        <ArrowRight size={big ? 22 : 20} className="transition-transform group-hover:translate-x-1" />
      </span>
    </button>
  );
}

export default function ClassicLanding() {
  // Meta Pixel + GA4: quem chegou na LP do tráfego pago viu o produto
  useEffect(() => {
    fbq('track', 'ViewContent', { content_name: 'lp-classic' });
    gtag('event', 'view_item', { items: [{ item_name: 'lp-classic' }] });
  }, []);

  const go = (method?: 'pix') => { window.location.href = method ? `${CHECKOUT}&method=pix` : CHECKOUT; };

  return (
    <div className="bg-gray-900 text-white font-sans overflow-x-hidden">
      {/* ── Header mínimo ─────────────────────────────────────────────────── */}
      <header className="relative z-20 max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 flex items-center justify-center shadow-glow">
            <Scan size={18} />
          </div>
          <span className="font-extrabold text-lg tracking-tight">Viora</span>
        </div>
        <button
          onClick={() => go()}
          className="text-sm font-bold text-gray-950 bg-brand-400 hover:bg-brand-300 px-5 py-2 rounded-xl transition-colors"
        >
          Começar por R$ 5
        </button>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative">
        {/* Glows de fundo — gradientes radiais puros, SEM filter:blur.
            iOS Safari trava com várias camadas grandes de blur() (a página
            nem chegava a pintar no iPhone); gradiente dá o mesmo visual. */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.18),transparent_65%)]" />
        <div className="pointer-events-none absolute top-40 -left-40 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.10),transparent_65%)]" />
        <div className="pointer-events-none absolute top-20 -right-32 w-[520px] h-[520px] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.10),transparent_65%)]" />

        <div className="relative max-w-6xl mx-auto px-4 pt-10 pb-20 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-7 shadow-[0_0_25px_rgba(245,158,11,0.15)]">
              <Flame size={13} className="animate-pulse" />
              Preço de lançamento — depois sobe pra R$ 29,90
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.06] tracking-tight mb-6">
              Nutricionista e personal{' '}
              <span
                className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-emerald-300 to-brand-400 animate-gradient-shift"
                style={{ backgroundSize: '200% 200%' }}
              >
                24h no seu WhatsApp
              </span>{' '}
              por menos de R$ 0,50/dia
            </h1>

            <p className="text-lg text-gray-300 leading-relaxed mb-9 max-w-xl mx-auto lg:mx-0">
              <strong className="text-white">Foto do prato</strong> → calorias, proteína e nota em segundos.{' '}
              <strong className="text-white">Foto sua</strong> → avaliação física + plano de treino e dieta em PDF.
              Sem digitar nada, sem pesar comida, sem baixar app.
            </p>

            <CtaButton onClick={() => go()}>Começar agora por R$ 5</CtaButton>
            <p className="mt-4 text-sm text-gray-400">
              1º mês R$ 5 · depois R$ 14,99/mês · cancela quando quiser
            </p>
          </div>

          {/* Card real flutuando com chips */}
          <div className="flex-1 w-full max-w-sm relative">
            <div className="absolute -inset-10 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.22),transparent_70%)]" />
            <div className="relative animate-float">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-3 shadow-2xl ring-1 ring-brand-500/20">
                <Image
                  src="/lp/card-comida.png"
                  alt="Análise real do Viora: calorias, macros, nota do prato e dica do coach"
                  width={640}
                  height={640}
                  priority
                  className="rounded-2xl w-full h-auto"
                />
              </div>
              <div className="absolute -left-4 top-10 hidden sm:flex items-center gap-2 bg-gray-850 border border-brand-500/30 rounded-xl px-3 py-2 shadow-glow">
                <Zap size={14} className="text-brand-400" />
                <span className="text-xs font-bold">Análise em segundos</span>
              </div>
              <div className="absolute -right-3 bottom-16 hidden sm:flex items-center gap-2 bg-gray-850 border border-amber-400/30 rounded-xl px-3 py-2 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
                <MessageCircle size={14} className="text-amber-300" />
                <span className="text-xs font-bold">Direto no WhatsApp</span>
              </div>
            </div>
            <p className="relative text-center text-xs text-gray-500 mt-4">
              ☝️ Card real do produto — é isso que chega no seu zap
            </p>
          </div>
        </div>

        {/* Strip de garantias (sem números inventados) */}
        <div className="relative border-y border-white/5 bg-white/[0.02]">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-gray-400">
            <span className="flex items-center gap-2"><Zap size={14} className="text-brand-400" /> Resposta em segundos</span>
            <span className="flex items-center gap-2"><MessageCircle size={14} className="text-brand-400" /> Zero app pra instalar</span>
            <span className="flex items-center gap-2"><Check size={14} className="text-brand-400" /> Cancela quando quiser</span>
            <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-brand-400" /> Pagamento seguro via Efí</span>
          </div>
        </div>
      </section>

      {/* ── O que você recebe ─────────────────────────────────────────────── */}
      <section className="relative max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center tracking-tight mb-3">
          4 profissionais em 1,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-emerald-300">no seu bolso</span>
        </h2>
        <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12">
          Tudo que uma equipe cara faria por você — respondendo no WhatsApp, a qualquer hora.
        </p>

        <div className="grid sm:grid-cols-2 gap-5">
          {[
            {
              icon: <Camera size={22} />,
              color: 'text-brand-400 bg-brand-500/10 border-brand-500/30',
              glow: 'hover:shadow-glow',
              title: 'Nutri de plantão',
              text: 'Foto do prato → calorias, proteína, carbo, gordura, nota e o que ajustar. Todas as refeições, todos os dias.',
            },
            {
              icon: <Activity size={22} />,
              color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
              glow: 'hover:shadow-[0_0_40px_rgba(56,189,248,0.15)]',
              title: 'Avaliação física',
              text: 'Foto sua → gordura estimada, massa muscular, biótipo. A cada nova foto, comparação da sua evolução.',
            },
            {
              icon: <Dumbbell size={22} />,
              color: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
              glow: 'hover:shadow-[0_0_40px_rgba(167,139,250,0.15)]',
              title: 'Personal trainer',
              text: 'Plano de treino em PDF montado pro SEU corpo e SEU objetivo — não ficha genérica de academia.',
            },
            {
              icon: <Salad size={22} />,
              color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
              glow: 'hover:shadow-[0_0_40px_rgba(251,146,60,0.15)]',
              title: 'Dieta sob medida',
              text: 'Plano alimentar completo junto no PDF: refeições, porções e metas de macros do seu dia a dia.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className={`bg-white/[0.03] border border-white/10 rounded-2xl p-6 transition-all hover:-translate-y-1 hover:border-white/20 ${f.glow}`}
            >
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${f.color}`}>
                {f.icon}
              </div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Como funciona ─────────────────────────────────────────────────── */}
      <section className="relative border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center tracking-tight mb-12">
            Funciona em 3 passos <span className="text-gray-500">(de verdade)</span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { n: '1', title: 'Tire a foto', text: 'Do prato ou de você — e manda no WhatsApp, como manda pra qualquer amigo.' },
              { n: '2', title: 'Receba na hora', text: 'Análise completa em segundos, com nota e dica do coach. Sem formulário, sem digitar.' },
              { n: '3', title: 'Evolua', text: 'Treino + dieta em PDF e comparação da evolução a cada nova foto. O coach cobra você.' },
            ].map((s) => (
              <div key={s.n} className="relative text-center sm:text-left">
                <span
                  className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-brand-400/60 to-brand-400/0 leading-none select-none"
                >
                  {s.n}
                </span>
                <h3 className="font-bold text-xl mt-2 mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Prova real: avaliação física ──────────────────────────────────── */}
      <section className="relative max-w-6xl mx-auto px-4 py-20">
        <div className="pointer-events-none absolute top-1/3 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.10),transparent_65%)]" />
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Isso aqui <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-brand-400">não é mockup</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Os dois cards abaixo são reais, gerados pelo mesmo sistema que atende os assinantes.
            Uma foto simples vira sua avaliação física completa.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="w-full max-w-[250px]">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-2">
              <Image
                src="/lp/exemplo-corpo.jpg"
                alt="Exemplo: foto de corpo inteiro, de frente, com roupa de treino"
                width={520}
                height={640}
                className="rounded-xl w-full h-auto"
              />
            </div>
            <p className="text-center text-xs text-gray-500 mt-3">Você manda uma foto assim…</p>
          </div>

          <div className="text-brand-400 shrink-0 rotate-90 md:rotate-0 animate-pulse">
            <ChevronRight size={44} strokeWidth={2.5} />
          </div>

          <div className="w-full max-w-[340px]">
            <div className="bg-white/5 border border-brand-500/20 rounded-2xl p-2 shadow-glow">
              <Image
                src="/lp/card-avaliacao.png"
                alt="Avaliação física real do Viora: gordura estimada, massa muscular, biótipo e evolução"
                width={640}
                height={640}
                className="rounded-xl w-full h-auto"
              />
            </div>
            <p className="text-center text-xs text-gray-500 mt-3">…e recebe isto + treino e dieta em PDF 📄</p>
          </div>
        </div>
      </section>

      {/* ── O produto por dentro: evolução, treino, dieta ─────────────────── */}
      <section className="relative border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              E por dentro,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-brand-400 to-orange-400">
                é assim que você acompanha
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Evolução comparada no painel + plano de treino e dieta que chegam prontos em PDF.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Tela 1: Evolução (painel) */}
            <div className="bg-gray-850 border border-sky-500/20 rounded-2xl overflow-hidden hover:shadow-[0_0_40px_rgba(56,189,248,0.12)] transition-shadow">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.03]">
                <TrendingUp size={15} className="text-sky-400" />
                <span className="text-sm font-bold">Sua evolução</span>
                <span className="ml-auto text-[10px] font-bold text-sky-300 bg-sky-500/10 border border-sky-500/30 rounded-full px-2 py-0.5">45 dias</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3">
                    <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">1ª avaliação</p>
                    <p className="text-2xl font-extrabold text-gray-300">24%</p>
                    <p className="text-[10px] text-gray-500">gordura estimada</p>
                  </div>
                  <div className="bg-brand-500/10 border border-brand-500/30 rounded-xl p-3">
                    <p className="text-[10px] uppercase font-bold text-brand-400 mb-1">Hoje</p>
                    <p className="text-2xl font-extrabold text-brand-300">19%</p>
                    <p className="text-[10px] text-brand-400/80">gordura estimada</p>
                  </div>
                </div>
                {[
                  { label: 'Gordura corporal', delta: '-5%', up: false },
                  { label: 'Massa muscular', delta: 'média → alta', up: true },
                  { label: 'Nota média dos pratos', delta: '6,2 → 8,4', up: true },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-400">{r.label}</span>
                    <span className={`flex items-center gap-1 text-xs font-bold ${r.up ? 'text-brand-400' : 'text-brand-400'}`}>
                      {r.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {r.delta}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tela 2: Treino (PDF) */}
            <div className="bg-gray-850 border border-violet-500/20 rounded-2xl overflow-hidden hover:shadow-[0_0_40px_rgba(167,139,250,0.12)] transition-shadow">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.03]">
                <Dumbbell size={15} className="text-violet-400" />
                <span className="text-sm font-bold">Seu treino</span>
                <span className="ml-auto text-[10px] font-bold text-violet-300 bg-violet-500/10 border border-violet-500/30 rounded-full px-2 py-0.5">PDF</span>
              </div>
              <div className="p-4">
                <p className="text-xs font-bold text-violet-300 uppercase tracking-wide mb-3">Treino A · Peito + Tríceps</p>
                <div className="space-y-2">
                  {[
                    ['Supino reto', '4×10'],
                    ['Crucifixo inclinado', '3×12'],
                    ['Tríceps corda', '3×15'],
                    ['Flexão até a falha', '3×'],
                  ].map(([ex, sets]) => (
                    <div key={ex} className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2.5">
                      <span className="text-xs text-gray-300">{ex}</span>
                      <span className="text-xs font-bold text-violet-300">{sets}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-gray-500 leading-relaxed">
                  + Treinos B e C, aquecimento e progressão semanal — montados pro seu nível e objetivo.
                </p>
              </div>
            </div>

            {/* Tela 3: Dieta (PDF) */}
            <div className="bg-gray-850 border border-orange-500/20 rounded-2xl overflow-hidden hover:shadow-[0_0_40px_rgba(251,146,60,0.12)] transition-shadow">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.03]">
                <Salad size={15} className="text-orange-400" />
                <span className="text-sm font-bold">Sua dieta</span>
                <span className="ml-auto text-[10px] font-bold text-orange-300 bg-orange-500/10 border border-orange-500/30 rounded-full px-2 py-0.5">PDF</span>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {[
                    ['☕ Café', 'Ovos mexidos + aveia', '420 kcal'],
                    ['🍽️ Almoço', 'Frango, arroz e salada', '650 kcal'],
                    ['🥪 Lanche', 'Iogurte + fruta', '250 kcal'],
                    ['🌙 Jantar', 'Peixe com legumes', '480 kcal'],
                  ].map(([meal, food, kcal]) => (
                    <div key={meal} className="bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-200">{meal}</span>
                        <span className="text-[11px] font-bold text-orange-300">{kcal}</span>
                      </div>
                      <p className="text-[11px] text-gray-500">{food}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2">
                  <span className="text-[11px] font-bold text-orange-200">Meta do dia</span>
                  <span className="text-[11px] font-bold text-orange-300">1.800 kcal · 140g proteína</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            Ilustração do formato — o seu sai personalizado pro seu corpo, rotina e objetivo.
          </p>
        </div>
      </section>

      {/* ── Âncora de preço ───────────────────────────────────────────────── */}
      <section className="relative max-w-3xl mx-auto px-4 py-20">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center tracking-tight mb-10">Faça a conta 🧮</h2>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-gray-400">Nutricionista (consulta + acompanhamento)</span>
            <span className="font-semibold text-gray-500 line-through decoration-red-400/70">R$ 250+/mês</span>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-gray-400">Personal trainer</span>
            <span className="font-semibold text-gray-500 line-through decoration-red-400/70">R$ 300+/mês</span>
          </div>
          <div className="flex items-center justify-between px-6 py-5 bg-brand-500/10 border-l-2 border-l-brand-400">
            <span className="font-bold text-white">Viora — os dois, 24h no WhatsApp</span>
            <span className="font-extrabold text-brand-300 text-2xl whitespace-nowrap drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]">R$ 14,99<span className="text-sm font-medium text-brand-400">/mês</span></span>
          </div>
        </div>
        <p className="text-center text-sm text-gray-400 mt-4">
          Menos de <strong className="text-white">R$ 0,50 por dia</strong> — e no primeiro mês, <strong className="text-brand-300">R$ 5</strong>.
        </p>
      </section>

      {/* ── Oferta de lançamento ──────────────────────────────────────────── */}
      <section className="relative px-4 py-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.12),transparent_60%)]" />
        <div className="relative max-w-md mx-auto">
          {/* Borda com gradiente */}
          <div
            className="rounded-3xl p-[1.5px] bg-gradient-to-br from-brand-400 via-brand-700/40 to-amber-400/60 shadow-[0_0_80px_rgba(16,185,129,0.25)]"
          >
            <div className="bg-gray-900 rounded-3xl p-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-6">
                <Flame size={12} className="animate-pulse" />
                Oferta de lançamento
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-emerald-200">R$ 5</span>
                <span className="text-gray-400 text-sm font-medium">no 1º mês</span>
              </div>
              <p className="text-gray-300 mt-3 text-sm leading-relaxed">
                Depois, <strong className="text-white">R$ 14,99/mês travado por 1 ano</strong> pra quem assinar
                agora. Quem entrar depois do lançamento paga{' '}
                <span className="line-through text-gray-500">R$ 29,90</span>.
              </p>

              <div className="my-7 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

              <ul className="space-y-3.5 mb-8">
                {[
                  'Análise das suas refeições todos os dias',
                  'Avaliação física com evolução comparada',
                  'Plano de treino + dieta em PDF, do seu jeito',
                  'Coach com personalidade (puxa sua orelha se precisar)',
                  'Tudo no WhatsApp que você já usa — zero app novo',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-200">
                    <div className="bg-brand-500 mt-0.5 rounded-full p-0.5 text-gray-950 shadow-glow">
                      <Check className="h-3 w-3" strokeWidth={3.5} />
                    </div>
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>

              <CtaButton onClick={() => go()} big>Ativar por R$ 5 agora</CtaButton>

              <button
                onClick={() => go('pix')}
                className="mt-4 w-full text-center text-brand-300 hover:text-brand-200 text-sm font-semibold underline underline-offset-4 decoration-brand-700 transition-colors"
              >
                Prefere Pix? Pacotes de 3 a 12 meses com até 27% off
              </button>

              <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
                <ShieldCheck size={13} className="text-brand-400" />
                Pagamento seguro via Efí · cancela quando quiser, sem multa
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="relative border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto px-4 py-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center tracking-tight mb-10">
            Perguntas diretas, <span className="text-brand-400">respostas diretas</span>
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Preciso instalar alguma coisa?',
                a: 'Não. Funciona no WhatsApp que você já usa, no número que você já tem.',
                icon: <MessageCircle size={18} />,
              },
              {
                q: 'Como recebo o acesso depois de pagar?',
                a: 'Na hora. O número de WhatsApp que você cadastrou no checkout já sai mandando foto de prato e recebendo análise.',
                icon: <Zap size={18} />,
              },
              {
                q: 'Posso cancelar?',
                a: 'Sim, no painel, em 2 cliques — sem fidelidade, sem multa, sem ligar pra ninguém. Cancelou, seu acesso continua até o fim do período já pago.',
                icon: <Check size={18} />,
              },
              {
                q: 'O preço sobe pra R$ 29,90 pra mim também?',
                a: 'Não. Quem assina no lançamento mantém R$ 14,99/mês por 1 ano. O preço novo vale só pra quem entrar depois.',
                icon: <FileText size={18} />,
              },
            ].map((f) => (
              <div key={f.q} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex gap-4 hover:border-brand-500/30 transition-colors">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-400 flex items-center justify-center">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold mb-1">{f.q}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.a}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA final */}
          <div className="text-center mt-14">
            <div className="inline-flex items-center gap-2 text-amber-300 text-sm font-bold mb-5">
              <Sparkles size={15} />
              R$ 5 hoje. R$ 29,90 pra quem deixar pra depois.
            </div>
            <div>
              <CtaButton onClick={() => go()} big>Começar por R$ 5</CtaButton>
            </div>
            <p className="mt-4 text-sm text-gray-500">Leva 2 minutos. O coach te espera no WhatsApp. 💪</p>
          </div>
        </div>
      </section>

      {/* ── Footer mínimo ─────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} Viora · app.jeanspagolla.com.br</span>
          <div className="flex gap-5">
            <a href="/termos" className="hover:text-gray-300 transition-colors">Termos</a>
            <a href="/privacidade" className="hover:text-gray-300 transition-colors">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
