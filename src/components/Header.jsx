'use client';

import { useState, useEffect } from 'react';
import Logo from './Logo';
import { supabase } from '@/lib/supabase';

export default function Header() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setLoggedIn(!!session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setLoggedIn(!!session));
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <>
      <div className="scroll-rail" aria-hidden="true">
        <div className="scroll-rail__fill" style={{ width: `${scrollProgress}%` }}></div>
      </div>

      <header className="site-header">
        <div className="wrap">
          <Logo href="#hero" withBadge />
          
          <nav className="header-actions">
            <a href="#viora" className="header-nav-link">Ecossistema Viora</a>
            <a href="#quiz" className="header-nav-link">Faça o Teste</a>
            <a href="#metodo" className="header-nav-link">O Método</a>
            {loggedIn ? (
              <a href="/painel" className="header-cta">Meu Painel</a>
            ) : (
              <>
                <a href="/painel" className="header-nav-link">Minha Área</a>
                <a href="#oferta" className="header-cta">Quero Renascer</a>
              </>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
