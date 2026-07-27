'use client';

import { useState, useEffect } from 'react';

export default function SocialProofToast() {
  const [activeToast, setActiveToast] = useState(null);

  const notifications = [
    { name: 'Luciana M. (São Paulo)', action: 'se inscreveu no <b>Renascer Completo</b>', time: 'Há 2 minutos' },
    { name: 'Ricardo F. (Curitiba)', action: 'iniciou o <b>Desafio Renascer 30 Dias</b>', time: 'Há 4 minutos' },
    { name: 'Mariana S. (Belo Horizonte)', action: 'eliminou 4.2kg na 1ª semana com o Viora', time: 'Há 7 minutos' },
    { name: 'Camila T. (Rio de Janeiro)', action: 'adquiriu o <b>Renascer Completo</b>', time: 'Há 11 minutos' },
    { name: 'Gabriel K. (Porto Alegre)', action: 'acabou de destravar seu plano alimentar Viora', time: 'Há 14 minutos' }
  ];

  useEffect(() => {
    let index = 0;
    const show = () => {
      setActiveToast(notifications[index]);
      setTimeout(() => {
        setActiveToast(null);
        index = (index + 1) % notifications.length;
      }, 5000);
    };

    const initialTimer = setTimeout(() => {
      show();
      const interval = setInterval(show, 14000);
      return () => clearInterval(interval);
    }, 3500);

    return () => clearTimeout(initialTimer);
  }, []);

  if (!activeToast) return null;

  return (
    <div className={`proof-toast ${activeToast ? 'active' : ''}`}>
      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--moss-deep)', color: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 }}>
        ✓
      </div>
      <div>
        <div style={{ fontSize: '0.86rem', color: 'var(--bone)', lineHeight: 1.4 }}>
          <span>{activeToast.name}</span> <span dangerouslySetInnerHTML={{ __html: activeToast.action }} />
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--bone-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>
          {activeToast.time}
        </div>
      </div>
    </div>
  );
}
