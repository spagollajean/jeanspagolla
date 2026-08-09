'use client';

import { useRef, useState, useCallback } from 'react';

export default function BeforeAfterSlider() {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);

  const updatePosition = useCallback((clientX) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    setSliderPos((x / rect.width) * 100);
  }, []);

  // Pointer Events (unifica mouse/touch/caneta) + setPointerCapture: o
  // arraste continua funcionando mesmo se o cursor sair da caixa antes de
  // soltar o botão -- com mouse events simples (versão anterior) o drag
  // travava assim que o mouse cruzava a borda do container.
  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  };
  const handlePointerMove = (e) => {
    if (e.buttons !== 1 && e.pointerType === 'mouse') return;
    updatePosition(e.clientX);
  };

  return (
    <section className="section-dark pad" id="transformacoes" style={{ background: 'var(--dark-1)' }}>
      <div className="wrap">
        <div className="section-head text-center">
          <span className="eyebrow">Resultados Reais</span>
          <h2 style={{ color: 'var(--bone)' }}>Arraste o Slider e Veja a Transformação</h2>
          <p style={{ color: 'var(--bone-soft)' }}>A evolução física e metabólica real de quem seguiu o Protocolo Renascer + Viora AI.</p>
        </div>

        <div
          className="comparison-slider-container"
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
        >
          <div className="comparison-img-before">
            <img src="/renascer/natalia-andrade-antes.jpg" alt="Antes do Protocolo" draggable={false} />
            <span className="slider-label slider-label--before">Antes: Inflamação & Retenção</span>
          </div>
          <div className="comparison-img-after" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
            <img src="/renascer/natalia-andrade-depois.jpg" alt="Depois do Protocolo" draggable={false} />
            <span className="slider-label slider-label--after">Depois: -37kg, Desinflamada & Vital</span>
          </div>

          <div className="comparison-divider" style={{ left: `${sliderPos}%` }} />
          <div className="comparison-slider-handle" style={{ left: `${sliderPos}%` }}>
            <div className="handle-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" transform="translate(-3,0)" />
                <polyline points="9 18 15 12 9 6" transform="translate(3,0)" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
