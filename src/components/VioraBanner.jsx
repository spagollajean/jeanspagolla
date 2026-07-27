export default function VioraBanner() {
  return (
    <section className="section-dark" style={{ padding: '0 0 clamp(4rem, 8vw, 7rem)' }}>
      <div className="wrap">
        <div
          style={{
            background: 'linear-gradient(135deg, var(--dark-2), var(--dark-1))',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: 'clamp(2rem, 5vw, 3rem)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.6rem',
            boxShadow: '0 25px 60px -25px rgba(16, 185, 129, 0.25)',
          }}
        >
          <div style={{ maxWidth: '46ch' }}>
            <span className="tag-pill tag-pill--viora" style={{ marginBottom: '1rem' }}>
              <span className="dot"></span>
              App exclusivo Renascer
            </span>
            <h3 style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2rem)', color: 'var(--bone)', marginTop: '0.9rem' }}>
              Conheça o <span style={{ color: 'var(--viora-emerald)' }}>Viora</span>
            </h3>
            <p style={{ marginTop: '0.7rem', color: 'var(--bone-soft)', fontSize: '1rem' }}>
              Sua IA nutricional de bolso: fotografe o prato, calcule calorias e macros na hora, e receba treino e dieta personalizados pelo WhatsApp.
            </p>
          </div>
          <a
            href="https://app.jeanspagolla.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--viora"
            style={{ flexShrink: 0 }}
          >
            Acessar o Viora
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </a>
        </div>
      </div>
    </section>
  );
}
