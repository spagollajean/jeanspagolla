'use client';

import { useState, useEffect } from 'react';

export default function Hero() {
  const [liveViewers, setLiveViewers] = useState(142);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveViewers(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(120, Math.min(180, prev + delta));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero section-dark" id="hero">
      <div className="wrap">
        <div className="hero-grid">
          <div>
            <span className="tag-pill tag-pill--viora">
              <span className="dot"></span>
              Acompanhamento Integrado com IA Viora
            </span>

            <h1>Desinflame seu corpo, recupere sua energia e sua <span className="accent">fé</span> em 30 dias.</h1>

            <p className="hero__sub">
              Sem remédios. Sem dietas da moda. Protocolo de desintoxicação biológica, treino fisiológico e mentalidade com acompanhamento direto de Jean e monitoramento metabólico contínuo pelo <strong style={{ color: 'var(--viora-emerald)' }}>Viora</strong>.
            </p>

            <div style={{ marginTop: '2.2rem', display: 'flex', flexWrap: 'wrap', gap: '1.2rem', alignItems: 'center' }}>
              <a href="#oferta" className="btn btn--ochre">
                Quero Renascer Agora
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </a>
              <a href="#quiz" className="btn btn--outline">
                Avaliar Inflamação
              </a>
            </div>

            <div style={{ marginTop: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.92rem', color: 'var(--bone-soft)' }}>
              <div style={{ display: 'flex' }}>
                <span style={{ width: '30px', height: '30px', borderRadius: '50%', border: '2px solid var(--dark-0)', backgroundImage: "url('/renascer/janeide-oliveira-depois.jpg')", backgroundSize: 'cover', backgroundPosition: 'top' }}></span>
                <span style={{ width: '30px', height: '30px', borderRadius: '50%', border: '2px solid var(--dark-0)', marginLeft: '-10px', backgroundImage: "url('/renascer/anderson-melo-depois.jpg')", backgroundSize: 'cover', backgroundPosition: 'top' }}></span>
                <span style={{ width: '30px', height: '30px', borderRadius: '50%', border: '2px solid var(--dark-0)', marginLeft: '-10px', backgroundImage: "url('/renascer/luiza-santos-depois.jpg')", backgroundSize: 'cover', backgroundPosition: 'top' }}></span>
              </div>
              <span>Milhares de pessoas já passaram por essa virada.</span>
            </div>

            <div style={{ marginTop: '1.1rem' }}>
              <span className="tag-pill tag-pill--viora">
                <span className="dot"></span>
                <b>{liveViewers}</b> pessoas analisando este protocolo agora
              </span>
            </div>
          </div>

          <div>
            <div className="hero-photo">
              <div className="hero-viora-float-badge">
                <span className="badge-icon">✓</span>
                <span className="badge-text">Metabolismo Otimizado por IA</span>
              </div>

              <img src="/renascer/jean-hero.jpg" alt="Jean - Fitness & Wellness e Terapeuta" />

              <div className="hero-photo__caption">
                <span className="hero-photo__name">Jean Pagolla</span>
                <span className="hero-photo__role">Fitness & Wellness e Terapeuta Integrativo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="terrain terrain--to-cream" aria-hidden="true">
        <svg viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="M0,40 C150,10 300,55 450,30 C600,5 750,50 900,25 C1050,5 1150,35 1200,60 L1200,60 L0,60 Z"/></svg>
      </div>
    </section>
  );
}
