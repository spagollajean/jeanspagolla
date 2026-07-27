export default function ReceiptSection() {
  return (
    <section className="section-light pad" id="valor">
      <div className="wrap">
        <div className="section-head text-center">
          <span className="eyebrow">Quanto isso custaria separado?</span>
          <h2>Pensa comigo no que você precisaria contratar hoje</h2>
        </div>

        <div className="receipt">
          <div style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.78rem', color: 'var(--ink-soft)', textAlign: 'center', marginBottom: '1.6rem' }}>
            Conta avulsa, por mês
          </div>

          <div className="receipt-row">
            <span>Personal trainer particular</span>
            <span>R$800–1.500</span>
          </div>
          <div className="receipt-row">
            <span>Nutricionista com acompanhamento</span>
            <span>R$300–500</span>
          </div>
          <div className="receipt-row">
            <span>Terapeuta / psicólogo (semanal)</span>
            <span>R$600–1.000</span>
          </div>
          <div className="receipt-row">
            <span>App de acompanhamento diário no WhatsApp</span>
            <span>R$150–300</span>
          </div>
          <div className="receipt-row">
            <span>Grupo de apoio que te cobra todo dia</span>
            <span>não existe</span>
          </div>
          <div className="receipt-row" style={{ fontWeight: 700 }}>
            <span>Total avulso</span>
            <span style={{ color: 'var(--clay)' }}>R$1.850–3.300</span>
          </div>

          <div className="receipt-final">
            <span>No Renascer, a partir de</span>
            <span>R$59,90/mês</span>
          </div>

          <div style={{ marginTop: '1.1rem', fontSize: '0.75rem', color: 'var(--ink-soft)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
            valores de mercado ilustrativos, a título de referência
          </div>
        </div>

        <p style={{ textAlign: 'center', maxWidth: '52ch', margin: '2rem auto 0', color: 'var(--ink-soft)' }}>
          E ainda assim, ninguém ali estaria conectando seu corpo, sua mente e o seu espírito. No Renascer, os três são tratados juntos, no mesmo lugar, com acompanhamento diário e a inteligência do Viora.
        </p>
      </div>
    </section>
  );
}
