export default function VioraShowcase() {
  return (
    <section className="section-dark pad" id="viora" style={{ background: 'var(--dark-1)' }}>
      <div className="wrap">
        <div className="section-head text-center">
          <span className="eyebrow" style={{ color: 'var(--viora-emerald)' }}>Tecnologia Exclusiva</span>
          <h2 style={{ color: 'var(--bone)' }}>Integrado ao Ecossistema <span style={{ color: 'var(--viora-emerald)', whiteSpace: 'nowrap' }}>Viora AI</span></h2>
          <p style={{ color: 'var(--bone-soft)' }}>A inteligência artificial que lê seus alimentos, analisa seu corpo e adapta sua dieta e treino em tempo real.</p>
        </div>

        <div className="viora-showcase-grid">
          <div className="viora-card-item">
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="4"/><path d="M16 8h.01"/></svg>
            </div>
            <h3>Leitura de Pratos por Foto</h3>
            <p>Tire a foto de qualquer refeição. A IA do Viora identifica instantaneamente o conteúdo, calorias, carga glicêmica e macronutrientes do seu prato.</p>
          </div>

          <div className="viora-card-item">
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h3>Bioimpedância por IA</h3>
            <p>Monitore percentual de gordura, retenção hídrica e massa magra semanalmente sem precisar de balanças caras ou clínicas.</p>
          </div>

          <div className="viora-card-item">
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <h3>Ajuste Dinâmico de Treino</h3>
            <p>Seu treino e plano anti-inflamatório recalibrados automaticamente caso você sinta fadiga, estresse ou estagnação no peso.</p>
          </div>
        </div>
      </div>

      <div className="terrain terrain--to-cream" aria-hidden="true">
        <svg viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="M0,20 C200,50 350,5 500,30 C650,55 800,10 950,35 C1050,50 1150,25 1200,60 L1200,60 L0,60 Z"/></svg>
      </div>
    </section>
  );
}
