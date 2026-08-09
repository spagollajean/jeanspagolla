export default function StorySection() {
  return (
    <section className="section-light pad" id="historia">
      <div className="wrap">
        <div className="story-layout">
          <div className="story-photo--filled">
            <figure>
              <img src="/renascer/jean-antes.jpg" alt="Jean antes do protocolo" />
            </figure>
            <figure>
              <img src="/renascer/jean-depois.jpg" alt="Jean depois do protocolo" />
            </figure>
          </div>

          <div>
            <span className="story-credential">Fitness & Wellness · Terapeuta · Educação Física desde 2012</span>

            <h2 style={{ fontSize: 'clamp(1.8rem, 2.5vw, 2.6rem)', marginBottom: '1.2rem' }}>Antes de qualquer diploma, eu fui o cara que vivia cheio de remédio.</h2>

            <p style={{ color: 'var(--ink-soft)', fontSize: '1.05rem', marginBottom: '1.15rem' }}>
              Sinusite, rinite, antibiótico direto. Dor de cabeça constante. Por dentro, uma mente acelerada que eu não conseguia controlar, hoje eu sei que é <strong>TDAH e hiperatividade</strong>. Depressão profunda. Ansiedade. Crise de pânico.
            </p>

            <p style={{ color: 'var(--ink-soft)', fontSize: '1.05rem', marginBottom: '1.15rem' }}>
              Foi no meio dessa crise que eu descobri: era a comida. Açúcar e ultraprocessado o dia inteiro, como qualquer pessoa. Troquei tudo: café da manhã, almoço, os produtos que eu usava no corpo, por <strong>comida de verdade, de ingrediente único</strong>.
            </p>

            <p style={{ color: 'var(--ink-soft)', fontSize: '1.05rem', marginBottom: '1.15rem' }}>
              O corpo respondeu. A mente clareou. A energia voltou. E no meio da minha própria crise de pânico, comecei a postar no Instagram, do zero a <strong>230 mil seguidores</strong>, ensinando o que estava me salvando.
            </p>

            <p style={{ color: 'var(--ink-soft)', fontSize: '1.05rem' }}>
              Hoje eu não ensino teoria. Ensino o que tirou minha vida do fundo do poço: alimentação ancestral, treino e mentalidade, com fé, propósito e disciplina, e com o apoio da inteligência nutricional do <strong>Viora</strong> pra manter o acompanhamento diário. É o que eu chamo de <strong>Renascer</strong>, porque não foi só o corpo que se recuperou. Foi tudo, junto.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
