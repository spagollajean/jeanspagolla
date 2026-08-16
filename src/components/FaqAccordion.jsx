const faqs = [
  {
    q: 'Já tentei mil dietas e nada funcionou. Por que essa seria diferente?',
    a: 'Porque as outras atacaram sintoma. Aqui a gente vai na causa: desintoxicação e desinflamação real, não corte de caloria.',
  },
  {
    q: 'Funciona pra quem tem ansiedade, TDAH ou já teve depressão?',
    a: 'Funciona especialmente pra isso. Foi assim que eu me recuperei, e é o público que mais sente diferença no método.',
  },
  {
    q: 'Preciso ir pra academia?',
    a: 'Não. Tem protocolo de treino em casa (HIIT de 20 min) e também pra quem treina em academia.',
  },
  {
    q: 'Vou gastar muito trocando produtos e alimentação?',
    a: 'Não. A base é comida de verdade: carne, raiz, fruta, mel, geralmente mais barato que os processados que você compra hoje.',
  },
  {
    q: 'Como funciona o acompanhamento com o Viora?',
    a: 'Comunidade no Discord com acesso a mim, mais um APP direto no WhatsApp com a inteligência do Viora, que cobra sua rotina, fotos e evolução todos os dias no plano Completo.',
  },
  {
    q: 'E se eu quiser cancelar?',
    a: 'Cancelamento simples, sem burocracia, a qualquer momento.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function FaqAccordion() {
  return (
    <section className="section-dark pad" id="faq">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="wrap">
        <div className="section-head text-center">
          <span className="eyebrow">Perguntas frequentes</span>
          <h2 style={{ color: 'var(--bone)' }}>Antes de você decidir</h2>
        </div>

        <div className="faq-list">
          {faqs.map((f) => (
            <div className="faq-item" key={f.q}>
              <details>
                <summary>
                  <span>{f.q}</span>
                  <span className="plus">+</span>
                </summary>
                <p>{f.a}</p>
              </details>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
