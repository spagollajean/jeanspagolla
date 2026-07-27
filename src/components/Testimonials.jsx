const depoimentos = [
  {
    nome: 'Anderson Melo',
    meta: '42 anos · -23 kg',
    antes: '/renascer/anderson-melo-antes.jpg',
    depois: '/renascer/anderson-melo-depois.jpg',
    quote: '"Recuperei o corpo que eu tinha antes de desistir de mim mesmo. Hoje eu durmo bem, treino com energia e voltei a me sentir capaz."',
  },
  {
    nome: 'Janeide Oliveira',
    meta: '38 anos · -20 kg',
    antes: '/renascer/janeide-oliveira-antes.jpg',
    depois: '/renascer/janeide-oliveira-depois.jpg',
    quote: '"Eu já tinha desistido de me ver diferente. O Renascer não só desinflamou meu corpo, devolveu a vontade de me cuidar todos os dias."',
  },
  {
    nome: 'Edileuza Maria',
    meta: '36 anos · -27 kg',
    antes: '/renascer/edileuza-maria-antes.jpg',
    depois: '/renascer/edileuza-maria-depois.jpg',
    quote: '"Chorei quando vi essa comparação. Não foi só o peso que saiu, foi a vergonha de me olhar no espelho."',
  },
  {
    nome: 'Natalia Andrade',
    meta: '28 anos · -37 kg',
    antes: '/renascer/natalia-andrade-antes.jpg',
    depois: '/renascer/natalia-andrade-depois.jpg',
    quote: '"Tentei de tudo antes. Foi a primeira vez que o corpo respondeu de verdade, sem sofrimento e sem passar fome."',
  },
  {
    nome: 'Luiza Santos',
    meta: '31 anos · -17 kg',
    antes: '/renascer/luiza-santos-antes.jpg',
    depois: '/renascer/luiza-santos-depois.jpg',
    quote: '"Voltei a usar roupa que eu tinha guardado no armário. Mas o que mudou mesmo foi minha energia pra viver o dia."',
  },
  {
    nome: 'Raquel Bueno',
    meta: '34 anos · -17 kg',
    antes: '/renascer/raquel-bueno-antes.jpg',
    depois: '/renascer/raquel-bueno-depois.jpg',
    quote: '"Eu me escondia até em foto de família. Hoje eu me sinto bem de frente pro espelho, e isso não tem preço."',
  },
  {
    nome: 'Paula Jaro',
    meta: '26 anos · -23 kg',
    antes: '/renascer/paula-jaro-antes.jpg',
    depois: '/renascer/paula-jaro-depois.jpg',
    quote: '"Reaprendi a comer sem terror de engordar. O Renascer mudou minha relação com o espelho e com a comida, junto."',
  },
];

export default function Testimonials() {
  return (
    <section className="section-dark pad" style={{ background: 'var(--dark-0)', borderTop: '1px solid var(--line-dark)' }}>
      <div className="wrap">
        <div className="section-head text-center">
          <span className="eyebrow">Prova social</span>
          <h2 style={{ color: 'var(--bone)' }}>Resultados de dentro do Renascer</h2>
          <p style={{ color: 'var(--bone-soft)' }}>Sem edição, sem promessa vazia. Toque em cada resultado para ler o depoimento de quem já passou pelo mesmo lugar que você está agora.</p>
        </div>

        <div className="testi-grid">
          {depoimentos.map((d) => (
            <details className="testi-card" key={d.nome}>
              <summary>
                <div className="testi-photos">
                  <img src={d.antes} alt={`${d.nome} antes`} />
                  <img src={d.depois} alt={`${d.nome} depois`} />
                </div>
                <div className="testi-info">
                  <div className="testi-name">{d.nome}</div>
                  <div className="testi-meta">{d.meta}</div>
                  <div className="testi-toggle">
                    <span className="when-closed">ver depoimento</span>
                    <span className="when-open">ocultar depoimento</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                </div>
              </summary>
              <p className="testi-quote">{d.quote}</p>
            </details>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.6rem', fontSize: '0.78rem', color: 'var(--bone-faint)' }}>
          *resultados individuais, variam de acordo com adesão ao protocolo e histórico de cada aluno.
        </p>
      </div>

      <div className="terrain terrain--to-cream" aria-hidden="true">
        <svg viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="M0,40 C150,10 300,55 450,30 C600,5 750,50 900,25 C1050,5 1150,35 1200,60 L1200,60 L0,60 Z"/></svg>
      </div>
    </section>
  );
}
