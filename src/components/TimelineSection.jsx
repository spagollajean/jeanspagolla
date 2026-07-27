export default function TimelineSection() {
  return (
    <section className="section-dark pad" id="jornada" style={{ background: 'var(--dark-0)' }}>
      <div className="wrap">
        <div className="section-head text-center">
          <span className="eyebrow">O que esperar</span>
          <h2 style={{ color: 'var(--bone)' }}>Sua linha do tempo dentro do Renascer</h2>
        </div>

        <div className="wrap--narrow">
          <div className="timeline">
            <div className="tl-item">
              <div className="tl-when">Em 7 dias</div>
              <h4>Menos inchaço</h4>
              <p>Primeiros sinais de energia voltando, mente mais clara.</p>
            </div>

            <div className="tl-item">
              <div className="tl-when">Em 14 dias</div>
              <h4>Corpo desinflamado</h4>
              <p>Disposição real, sono melhor.</p>
            </div>

            <div className="tl-item">
              <div className="tl-when">Em 30 dias</div>
              <h4>Resultados como os de alunos do Renascer</h4>
              <p>Que já perderam até 16kg de gordura no primeiro mês, com mais energia e mais felicidade.</p>
            </div>
          </div>

          <p style={{ marginTop: '1.4rem', fontSize: '0.78rem', color: 'var(--bone-faint)' }}>
            *resultados variam de pessoa para pessoa e dependem de adesão ao protocolo.
          </p>
        </div>
      </div>
    </section>
  );
}
