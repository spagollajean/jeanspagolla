'use client';

import { useState, useEffect } from 'react';

export default function StickyMobileBar() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 600) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`sticky-cta-bar ${isVisible ? 'active' : ''}`}>
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--bone-faint)' }}>Protocolo Renascer + Viora</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ochre-bright)' }}>R$59,90<span style={{ fontSize: '0.75rem' }}>/mês</span></div>
      </div>
      <a href="#oferta" className="btn btn--viora" style={{ padding: '0.6rem 1.2rem', fontSize: '0.75rem' }}>
        Quero Renascer
      </a>
    </div>
  );
}
