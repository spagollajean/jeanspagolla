export default function FaqAccordion() {
  return (
    <section className="section-dark pad" id="faq">
      <div className="wrap">
        <div className="section-head text-center">
          <span className="eyebrow">Perguntas frequentes</span>
          <h2 style={{ color: 'var(--bone)' }}>Antes de você decidir</h2>
        </div>

        <div className="faq-list">
          <div className="faq-item">
            <details>
              <summary>
                <span>Já tentei mil dietas e nada funcionou. Por que essa seria diferente?</span>
                <span className="plus">+</span>
              </summary>
              <p>Porque as outras atacaram sintoma. Aqui a gente vai na causa: desintoxicação e desinflamação real, não corte de caloria.</p>
            </details>
          </div>

          <div className="faq-item">
            <details>
              <summary>
                <span>Funciona pra quem tem ansiedade, TDAH ou já teve depressão?</span>
                <span className="plus">+</span>
              </summary>
              <p>Funciona especialmente pra isso. Foi assim que eu me recuperei, e é o público que mais sente diferença no método.</p>
            </details>
          </div>

          <div className="faq-item">
            <details>
              <summary>
                <span>Preciso ir pra academia?</span>
                <span className="plus">+</span>
              </summary>
              <p>Não. Tem protocolo de treino em casa (HIIT de 20 min) e também pra quem treina em academia.</p>
            </details>
          </div>

          <div className="faq-item">
            <details>
              <summary>
                <span>Vou gastar muito trocando produtos e alimentação?</span>
                <span className="plus">+</span>
              </summary>
              <p>Não. A base é comida de verdade: carne, raiz, fruta, mel, geralmente mais barato que os processados que você compra hoje.</p>
            </details>
          </div>

          <div className="faq-item">
            <details>
              <summary>
                <span>Como funciona o acompanhamento com o Viora?</span>
                <span className="plus">+</span>
              </summary>
              <p>Comunidade no Skool com acesso a mim, mais um APP direto no WhatsApp com a inteligência do Viora, que cobra sua rotina, fotos e evolução todos os dias no plano Completo.</p>
            </details>
          </div>

          <div className="faq-item">
            <details>
              <summary>
                <span>E se eu quiser cancelar?</span>
                <span className="plus">+</span>
              </summary>
              <p>Cancelamento simples, sem burocracia, a qualquer momento.</p>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}
