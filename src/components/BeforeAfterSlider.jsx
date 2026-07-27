'use client';

import { useState, useRef } from 'react';

export default function BeforeAfterSlider() {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const updatePosition = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let x = clientX - rect.left;
    if (x < 0) x = 0;
    if (x > rect.width) x = rect.width;
    const pct = (x / rect.width) * 100;
    setSliderPos(pct);
  };

  const handleMouseDown = () => { isDragging.current = true; };
  const handleMouseUp = () => { isDragging.current = false; };
  const handleMouseMove = (e) => {
    if (isDragging.current) {
      updatePosition(e.clientX);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      updatePosition(e.touches[0].clientX);
    }
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
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
        >
          <div className="comparison-img-before">
            <img src="/renascer/natalia-andrade-antes.jpg" alt="Antes do Protocolo" />
            <span className="slider-label slider-label--before">Antes: Inflamação & Retenção</span>
          </div>
          <div className="comparison-img-after" style={{ width: `${sliderPos}%` }}>
            <img src="/renascer/natalia-andrade-depois.jpg" alt="Depois do Protocolo" />
            <span className="slider-label slider-label--after">Depois: -37kg, Desinflamada & Vital</span>
          </div>
          <div 
            className="comparison-slider-handle" 
            style={{ left: `${sliderPos}%` }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          >
            <div className="handle-circle">↔</div>
          </div>
        </div>
      </div>
    </section>
  );
}
