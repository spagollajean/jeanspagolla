export default function VillainSection() {
  return (
    <section className="section-dark pad" id="vilao">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Por que você vive assim</span>
          <h2 style={{ color: 'var(--bone)' }}>A culpa nunca foi sua.</h2>
          <p style={{ color: 'var(--bone-soft)' }}>O sistema te ensinou a comer errado e te vendeu o remédio depois. Veja o que está te adoecendo:</p>
        </div>

        <div className="villain-list">
          <div className="villain-item">
            <span className="mark">01</span>
            <div>
              <h4>Ultraprocessados disfarçados de saudáveis</h4>
              <p>Vício químico de sal, açúcar e gordura ruim que sequestra seu paladar e altera seus hormônios.</p>
            </div>
          </div>

          <div className="villain-item">
            <span className="mark">02</span>
            <div>
              <h4>Produtos do dia a dia cheios de química</h4>
              <p>Pasta de dente com flúor, desodorante com alumínio, panela de teflon. Pequenas doses de veneno, todos os dias.</p>
            </div>
          </div>

          <div className="villain-item">
            <span className="mark">03</span>
            <div>
              <h4>A informação que escondem de você</h4>
              <p>O sistema não tem interesse que você se cure. Tem interesse que você continue comprando remédios perpétuos.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="terrain terrain--to-cream" aria-hidden="true">
        <svg viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="M0,20 C200,50 350,5 500,30 C650,55 800,10 950,35 C1050,50 1150,25 1200,60 L1200,60 L0,60 Z"/></svg>
      </div>
    </section>
  );
}
