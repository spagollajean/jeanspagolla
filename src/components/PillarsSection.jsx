export default function PillarsSection() {
  return (
    <section className="section-dark pad" id="metodo">
      <div className="wrap">
        <div className="section-head text-center">
          <span className="eyebrow">Como funciona o método</span>
          <h2 style={{ color: 'var(--bone)' }}>Duas frentes centrais, trabalhando juntas.</h2>
          <p style={{ color: 'var(--bone-soft)' }}>Protocolo de desintoxicação e protocolo de desinflamação, que juntos recolocam seu corpo, sua mente e seu espírito pra funcionar como foram criados pra funcionar. A inteligência do Viora acompanha cada ajuste, todos os dias.</p>
        </div>

        <div className="method-pillars">
          <div className="pillar-card">
            <div className="num">Frente 01</div>
            <h3>Desintoxicação</h3>
            <p>Retirar o que está te envenenando aos poucos, da comida aos produtos que você usa todos os dias, pra destravar a resposta natural do corpo.</p>
          </div>

          <div className="pillar-card">
            <div className="num">Frente 02</div>
            <h3>Desinflamação</h3>
            <p>Recolocar o corpo em estado de equilíbrio, reduzindo a inflamação que alimenta o cansaço, a dor e a mente acelerada.</p>
          </div>
        </div>

        <p style={{ textAlign: 'center', maxWidth: '62ch', margin: '2.2rem auto 0', color: 'var(--bone-soft)' }}>
          O passo a passo completo, cada fase, cada ajuste, cada exercício, é revelado por dentro do programa. É ali que está o verdadeiro valor do método, construído com anos de estudo e experiência prática. <strong style={{ color: 'var(--bone)' }}>Não é sobre força de vontade. É sobre seguir uma sequência</strong> que já tirou centenas de pessoas do mesmo lugar de onde eu saí.
        </p>
      </div>

      <div className="terrain terrain--to-cream" aria-hidden="true">
        <svg viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="M0,20 C200,50 350,5 500,30 C650,55 800,10 950,35 C1050,50 1150,25 1200,60 L1200,60 L0,60 Z"/></svg>
      </div>
    </section>
  );
}
