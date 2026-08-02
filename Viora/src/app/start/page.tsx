'use client';

/**
 * Landing de conversão em formato de conversa de WhatsApp (/start).
 * O funil É uma demo do produto: o "bot" conversa, mostra os cards reais
 * (gerados pelo mesmo renderizador da produção) e fecha no /checkout.
 */

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { MAIN_SITE_URL } from '@/lib/site';

type Msg =
  | { kind: 'bot'; text: string }
  | { kind: 'user'; text: string }
  | { kind: 'image'; src: string; alt: string }
  | { kind: 'cta' };

type Step =
  | { type: 'bot'; text: string | ((c: Answers) => string); delay?: number }
  | { type: 'image'; src: string; alt: string; delay?: number }
  | { type: 'choice'; key: keyof Answers; options: string[] }
  | { type: 'cta' };

interface Answers {
  goal?: string;
  struggle?: string;
}

const STEPS: Step[] = [
  { type: 'bot', text: 'Oi! 👋 Aqui é o *Viora* — seu nutricionista e personal trainer de bolso, direto no WhatsApp.' },
  { type: 'bot', text: 'Me conta uma coisa: qual é o seu objetivo agora?' },
  { type: 'choice', key: 'goal', options: ['🔥 Emagrecer', '💪 Ganhar massa', '🥗 Comer melhor'] },
  {
    type: 'bot',
    text: (c) =>
      c.goal?.includes('Emagrecer')
        ? 'Boa! Emagrecer sem saber o que você come é jogar no escuro — e é exatamente isso que eu resolvo. 🎯'
        : c.goal?.includes('massa')
          ? 'Boa! Pra ganhar massa, bater a proteína do dia é 80% do jogo — e eu conto ela pra você sem esforço. 🎯'
          : 'Boa! Comer melhor começa por saber o que está no prato — e eu te mostro isso em segundos. 🎯',
  },
  { type: 'bot', text: 'Funciona assim: você tira uma *foto do seu prato* e me manda. Em segundos, eu te devolvo isto aqui 👇' },
  { type: 'image', src: '/lp/card-comida.png', alt: 'Análise de prato do Viora: calorias, macros, nota e dicas' },
  { type: 'bot', text: 'Calorias, proteína, carbo, gordura, nota do prato e dica do coach. *Sem digitar nada, sem pesar comida.*' },
  { type: 'bot', text: 'Deixa eu adivinhar: você já tentou contar calorias em aplicativo e desistiu porque dava trabalho? 😅' },
  { type: 'choice', key: 'struggle', options: ['😅 Exatamente isso', '🙋 Toda semana', '🤔 Nunca tentei'] },
  {
    type: 'bot',
    text: (c) =>
      c.struggle?.includes('Nunca')
        ? 'Então você vai começar já do jeito fácil. 😄'
        : 'Normal — digitar cada refeição cansa qualquer um. Aqui é só a foto. 📸',
  },
  { type: 'bot', text: 'E tem mais: me manda *uma foto sua* — de frente, com roupa de treino, simples assim 👇' },
  { type: 'image', src: '/lp/exemplo-corpo.jpg', alt: 'Exemplo de foto de corpo inteiro, de frente, na academia' },
  { type: 'bot', text: 'E eu monto sua *avaliação física completa*, na hora:' },
  { type: 'image', src: '/lp/card-avaliacao.png', alt: 'Avaliação física do Viora: gordura, massa muscular, biótipo e evolução' },
  { type: 'bot', text: 'E junto vem seu *plano completo de treino e dieta em PDF*, feito pro seu corpo e seu objetivo. A cada nova foto, eu comparo e te mostro sua evolução. 📈' },
  { type: 'bot', text: 'Uma nutricionista + um personal custam *R$ 400+ por mês*.' },
  { type: 'bot', text: 'O Viora vem incluso no plano *Renascer Completo*, por *R$ 79,90/mês* — cancela quando quiser, sem fidelidade.' },
  { type: 'bot', text: 'Bora? Leva 2 minutos pra ativar: 👇' },
  { type: 'cta' },
];

function fmt(text: string) {
  // *negrito* estilo WhatsApp
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((p, i) =>
    p.startsWith('*') && p.endsWith('*') ? (
      <strong key={i} className="font-semibold">{p.slice(1, -1)}</strong>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    )
  );
}

function now() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function StartFunnel() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<Step | null>(null);
  const answersRef = useRef<Answers>({});
  const stepRef = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  const scrollDown = () => {
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }));
  };

  const runNext = () => {
    const step = STEPS[stepRef.current];
    if (!step) return;

    if (step.type === 'choice') {
      setPendingChoice(step);
      scrollDown();
      return;
    }

    if (step.type === 'cta') {
      stepRef.current++;
      setMessages((m) => [...m, { kind: 'cta' }]);
      scrollDown();
      return;
    }

    const text = step.type === 'bot' ? (typeof step.text === 'function' ? step.text(answersRef.current) : step.text) : '';
    if (step.type === 'bot' && !text) {
      // passo condicional que resolveu vazio — pula
      stepRef.current++;
      runNext();
      return;
    }

    setTyping(true);
    scrollDown();
    const delay = step.delay ?? (step.type === 'image' ? 1400 : Math.min(2200, 700 + text.length * 14));
    setTimeout(() => {
      setTyping(false);
      stepRef.current++;
      setMessages((m) => [
        ...m,
        step.type === 'image' ? { kind: 'image', src: step.src, alt: step.alt } : { kind: 'bot', text },
      ]);
      scrollDown();
      setTimeout(runNext, 350);
    }, delay);
  };

  const choose = (option: string) => {
    if (!pendingChoice || pendingChoice.type !== 'choice') return;
    answersRef.current[pendingChoice.key] = option;
    setPendingChoice(null);
    stepRef.current++;
    setMessages((m) => [...m, { kind: 'user', text: option }]);
    scrollDown();
    setTimeout(runNext, 450);
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setTimeout(runNext, 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goCheckout = () => {
    const goal = answersRef.current.goal || '';
    window.location.href = `${MAIN_SITE_URL}/checkout?plan=completo&utm_source=lp-start&goal=${encodeURIComponent(goal.replace(/[^\wÀ-ÿ ]/g, '').trim())}`;
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#e5ddd5]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)', backgroundSize: '22px 22px' }}>
      {/* Header estilo WhatsApp */}
      <header className="flex items-center gap-3 bg-[#075e54] px-4 py-3 shadow-md z-10">
        <div className="relative">
          <Image src="/icon-192x192.png" alt="Viora" width={40} height={40} className="rounded-full ring-2 ring-white/20" />
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#075e54] rounded-full" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold leading-tight">Viora</p>
          <p className="text-green-100/90 text-xs">{typing ? 'digitando…' : 'online'}</p>
        </div>
        <a href="/" className="text-green-100/80 text-xs underline underline-offset-2">ver site</a>
      </header>

      {/* Conversa */}
      <main className="flex-1 overflow-y-auto px-3 py-4 space-y-2 max-w-lg w-full mx-auto">
        {messages.map((msg, i) => {
          if (msg.kind === 'cta') {
            return (
              <div key={i} className="py-3 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <button
                  onClick={() => goCheckout()}
                  className="w-full bg-[#25d366] hover:bg-[#1fb958] active:scale-[0.99] transition-all text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-green-600/30"
                >
                  🚀 Quero o Renascer Completo
                </button>
                <p className="text-center text-xs text-gray-500">Cancela quando quiser · Pagamento seguro via Stripe</p>
              </div>
            );
          }
          if (msg.kind === 'image') {
            return (
              <div key={i} className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white p-1.5 rounded-xl rounded-tl-sm shadow-sm max-w-[85%]">
                  <Image src={msg.src} alt={msg.alt} width={640} height={640} className="rounded-lg w-full h-auto" />
                  <p className="text-[10px] text-gray-400 text-right pr-1 pt-0.5">{now()}</p>
                </div>
              </div>
            );
          }
          const isUser = msg.kind === 'user';
          return (
            <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`${isUser ? 'bg-[#d9fdd3] rounded-tr-sm' : 'bg-white rounded-tl-sm'} px-3 py-2 rounded-xl shadow-sm max-w-[85%]`}>
                <p className="text-[15px] text-gray-800 leading-snug whitespace-pre-line">{fmt(msg.text)}</p>
                <p className="text-[10px] text-gray-400 text-right pt-0.5 flex items-center justify-end gap-1">
                  {now()}
                  {isUser && <span className="text-sky-500">✓✓</span>}
                </p>
              </div>
            </div>
          );
        })}

        {typing && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-3 rounded-xl rounded-tl-sm shadow-sm flex gap-1.5 items-center">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}

        {/* Botões de escolha (estilo respostas rápidas do WhatsApp) */}
        {pendingChoice?.type === 'choice' && !typing && (
          <div className="pt-2 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {pendingChoice.options.map((opt) => (
              <button
                key={opt}
                onClick={() => choose(opt)}
                className="w-full bg-white hover:bg-green-50 active:scale-[0.99] transition-all text-[#075e54] font-semibold py-3 rounded-2xl shadow-sm border border-gray-200"
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        <div ref={endRef} className="h-2" />
      </main>
    </div>
  );
}
