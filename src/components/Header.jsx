'use client';

import { useState, useEffect } from 'react';

export default function Header() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className="scroll-rail" aria-hidden="true">
        <div className="scroll-rail__fill" style={{ width: `${scrollProgress}%` }}></div>
      </div>

      <header className="site-header">
        <div className="wrap">
          <a href="#hero" className="logo">
            Ren<em>ascer</em>
            <span className="viora-badge-logo">Viora AI</span>
          </a>
          
          <nav className="header-actions">
            <a href="#viora" className="header-nav-link">Ecossistema Viora</a>
            <a href="#quiz" className="header-nav-link">Faça o Teste</a>
            <a href="#metodo" className="header-nav-link">O Método</a>
            <a href="#oferta" className="header-cta">Quero Renascer</a>
          </nav>
        </div>
      </header>
    </>
  );
}
