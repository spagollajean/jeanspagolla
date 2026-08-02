export default function PricingPlans() {
  return (
    <section className="section-dark pad" id="oferta">
      <div className="wrap">
        <div className="section-head text-center">
          <span className="eyebrow">Turma aberta</span>
          <h2 style={{ color: 'var(--bone)' }}>Escolha como quer ser acompanhado</h2>
          <p style={{ color: 'var(--bone-soft)' }}>Os dois planos dão acesso completo ao método e à inteligência do Viora. A diferença é o quanto de cobrança diária você quer ter comigo no seu bolso.</p>
        </div>

        <div className="offer-plans">
          {/* Plano Essencial */}
          <div className="offer-plan">
            <span className="tag-pill" style={{ margin: '0 auto 1.2rem auto' }}>Renascer Essencial</span>

            <div className="offer-price-row">
              <span className="offer-old">De R$297</span>
              <span className="offer-new">R$59,90 <small style={{ fontSize: '0.9rem', color: 'var(--bone-soft)' }}>/mês</small></span>
            </div>
            <p style={{ color: 'var(--bone-soft)', fontSize: '0.9rem', margin: '0.4rem 0 1.2rem', textAlign: 'center' }}>Menos que uma única sessão avulsa de personal trainer.</p>

            <ul className="offer-features">
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Aulas em vídeo com todos os protocolos</span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Comunidade no Skool com acesso a mim</span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Desafios, palestras e aulas ao vivo</span>
              </li>
              <li style={{ opacity: 0.35 }}>
                <span>Sem o APP direto no WhatsApp com o Viora</span>
              </li>
            </ul>

            <a href="#" className="btn btn--outline btn--block" style={{ marginTop: '1.6rem' }}>Quero o Essencial</a>
          </div>

          {/* Plano Completo + Viora */}
          <div className="offer-plan offer-plan--highlight">
            <div className="offer-plan__tag">Mais escolhido</div>
            <span className="tag-pill tag-pill--viora" style={{ margin: '0 auto 1.2rem auto' }}>Renascer Completo</span>

            <div className="offer-price-row">
              <span className="offer-old">De R$397</span>
              <span className="offer-new">R$79,90 <small style={{ fontSize: '0.9rem', color: 'var(--bone-soft)' }}>/mês</small></span>
            </div>
            <p style={{ color: 'var(--bone-soft)', fontSize: '0.9rem', margin: '0.4rem 0 1.2rem', textAlign: 'center' }}>Cobrança diária comigo e com o Viora, direto no seu WhatsApp.</p>

            <ul className="offer-features">
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span><b>Tudo do Renascer Essencial</b></span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span><b>APP Viora AI direto no WhatsApp</b>, que cobra suas fotos, rotina, alimentação e treino todos os dias</span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Leitura de pratos por foto e calculadora metabólica Viora</span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Menor chance de se perder no caminho</span>
              </li>
            </ul>

            <a href="#" className="btn btn--viora btn--block" style={{ marginTop: '1.6rem' }}>Quero o Completo</a>
          </div>
        </div>

        <p style={{ textAlign: 'center', maxWidth: '62ch', margin: '1.8rem auto 0', color: 'var(--bone-soft)' }}>
          As vagas são limitadas porque o acompanhamento é próximo e eu mesmo respondo na comunidade. <strong style={{ color: 'var(--bone)' }}>Quando essa turma fecha, a próxima só abre depois</strong>, e os preços de lançamento não se repetem.
        </p>
      </div>

      <div className="terrain terrain--to-cream" aria-hidden="true">
        <svg viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="M0,30 C170,5 330,50 500,25 C660,0 800,45 960,20 C1060,5 1140,30 1200,60 L1200,60 L0,60 Z"/></svg>
      </div>
    </section>
  );
}
