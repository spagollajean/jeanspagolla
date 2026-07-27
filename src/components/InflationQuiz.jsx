'use client';

import { useState } from 'react';

export default function InflationQuiz() {
  const [step, setStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState({});

  const toggleOption = (id) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;

  return (
    <section className="section-light pad" id="quiz">
      <div className="wrap">
        <div className="section-head text-center">
          <span className="eyebrow">Autoavaliação Rápida</span>
          <h2>Descubra seu Nível de Inflamação Corporal</h2>
          <p>Selecione abaixo os sintomas que você tem sentido nos últimos 30 dias para receber um diagnóstico metabólico imediato.</p>
        </div>

        <div className="quiz-container-box">
          <div className="quiz-progress-rail">
            <div className="quiz-progress-bar-fill" style={{ width: step === 1 ? '33.3%' : step === 2 ? '66.6%' : '100%' }}></div>
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div>
              <h3 style={{ color: 'var(--bone)', fontSize: '1.3rem', marginBottom: '0.4rem' }}>Passo 1/3: Sintomas Físicos e Inflamatórios</h3>
              <p style={{ color: 'var(--bone-soft)', fontSize: '0.9rem', marginBottom: '1.4rem' }}>Marque tudo o que você sente com frequência:</p>
              
              <div>
                <div className={`quiz-option-row ${selectedItems['q1'] ? 'selected' : ''}`} onClick={() => toggleOption('q1')}>
                  <div className="quiz-check-mark">✓</div>
                  <span style={{ color: 'var(--bone)' }}>Sinusite, rinite constante, enxaqueca ou dor de cabeça frequente</span>
                </div>
                <div className={`quiz-option-row ${selectedItems['q2'] ? 'selected' : ''}`} onClick={() => toggleOption('q2')}>
                  <div className="quiz-check-mark">✓</div>
                  <span style={{ color: 'var(--bone)' }}>Inchaço abdominal pós-refeição e retenção de líquidos</span>
                </div>
                <div className={`quiz-option-row ${selectedItems['q3'] ? 'selected' : ''}`} onClick={() => toggleOption('q3')}>
                  <div className="quiz-check-mark">✓</div>
                  <span style={{ color: 'var(--bone)' }}>Fadiga ao acordar mesmo tendo dormido 7h a 8h</span>
                </div>
                <div className={`quiz-option-row ${selectedItems['q4'] ? 'selected' : ''}`} onClick={() => toggleOption('q4')}>
                  <div className="quiz-check-mark">✓</div>
                  <span style={{ color: 'var(--bone)' }}>Dificuldade para perder peso ou acúmulo de gordura visceral</span>
                </div>
              </div>

              <button className="btn btn--ochre btn--block" onClick={() => setStep(2)} style={{ marginTop: '1.4rem' }}>
                Continuar Diagnóstico →
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <h3 style={{ color: 'var(--bone)', fontSize: '1.3rem', marginBottom: '0.4rem' }}>Passo 2/3: Saúde Mental e Foco</h3>
              <p style={{ color: 'var(--bone-soft)', fontSize: '0.9rem', marginBottom: '1.4rem' }}>Marque o que afeta sua rotina diária:</p>
              
              <div>
                <div className={`quiz-option-row ${selectedItems['q5'] ? 'selected' : ''}`} onClick={() => toggleOption('q5')}>
                  <div className="quiz-check-mark">✓</div>
                  <span style={{ color: 'var(--bone)' }}>Mente acelerada, episódios de ansiedade ou névoa mental (Brain Fog)</span>
                </div>
                <div className={`quiz-option-row ${selectedItems['q6'] ? 'selected' : ''}`} onClick={() => toggleOption('q6')}>
                  <div className="quiz-check-mark">✓</div>
                  <span style={{ color: 'var(--bone)' }}>Dificuldade de concentração ou sintomas de TDAH/Hiperatividade</span>
                </div>
                <div className={`quiz-option-row ${selectedItems['q7'] ? 'selected' : ''}`} onClick={() => toggleOption('q7')}>
                  <div className="quiz-check-mark">✓</div>
                  <span style={{ color: 'var(--bone)' }}>Compulsão por doces e ultraprocessados no fim do dia</span>
                </div>
                <div className={`quiz-option-row ${selectedItems['q8'] ? 'selected' : ''}`} onClick={() => toggleOption('q8')}>
                  <div className="quiz-check-mark">✓</div>
                  <span style={{ color: 'var(--bone)' }}>Oscilação brusca de humor ou falta de motivação e fé</span>
                </div>
              </div>

              <button className="btn btn--ochre btn--block" onClick={() => setStep(3)} style={{ marginTop: '1.4rem' }}>
                Ver Meu Diagnóstico →
              </button>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div>
              <h3 style={{ color: 'var(--bone)', fontSize: '1.3rem', marginBottom: '0.4rem' }}>Passo 3/3: Estilo de Vida e Hormônios</h3>
              <p style={{ color: 'var(--bone-soft)', fontSize: '0.9rem', marginBottom: '1.4rem' }}>Marque suas percepções pessoais:</p>
              
              <div>
                <div className={`quiz-option-row ${selectedItems['q9'] ? 'selected' : ''}`} onClick={() => toggleOption('q9')}>
                  <div className="quiz-check-mark">✓</div>
                  <span style={{ color: 'var(--bone)' }}>Baixa libido, queda na disposição física e forças</span>
                </div>
                <div className={`quiz-option-row ${selectedItems['q10'] ? 'selected' : ''}`} onClick={() => toggleOption('q10')}>
                  <div className="quiz-check-mark">✓</div>
                  <span style={{ color: 'var(--bone)' }}>Sensação de já ter tentado várias dietas sem resultado duradouro</span>
                </div>
              </div>

              <button className="btn btn--viora btn--block" onClick={() => setStep(4)} style={{ marginTop: '1.4rem' }}>
                Calcular Score de Inflamação
              </button>
            </div>
          )}

          {/* Result */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, margin: '1rem 0', color: selectedCount <= 2 ? 'var(--viora-emerald)' : selectedCount <= 5 ? 'var(--ochre-bright)' : 'var(--clay-soft)' }}>
                {selectedCount <= 2 ? 'Nível 1: Inflamação Inicial' : selectedCount <= 5 ? 'Nível 2: Inflamação Moderada/Alta' : 'Nível 3: Inflamação Sistêmica Crônica'}
              </div>
              <h3 style={{ color: 'var(--bone)', fontSize: '1.6rem' }}>
                {selectedCount <= 2 ? 'Atenção aos Sinais de Alerta' : selectedCount <= 5 ? 'Seu Corpo Pede um Reset Urgente!' : 'Urgência Crítica de Desintoxicação!'}
              </h3>
              <p style={{ color: 'var(--bone-soft)', marginTop: '0.8rem', marginBottom: '2rem', lineHeight: '1.6' }}>
                {selectedCount <= 2
                  ? 'Seu corpo já apresenta os primeiros sintomas de toxicidade e lentidão metabólica. O Protocolo Renascer 30 Dias reverterá esses sintomas antes que se tornem inflamações crônicas.'
                  : selectedCount <= 5
                  ? 'Sua disposição, foco mental e metabolização de gordura estão fortemente afetados por toxinas e inflamação celular. A combinação Renascer + Viora é a solução exata para restaurar sua vitalidade.'
                  : 'Você se encontra em estado de sobrecarga metabólica e mental (névoa mental, fadiga extrema e retenção). É indispensável iniciar a desinflamação com o Protocolo Renascer e o acompanhamento Viora AI imediatamente.'}
              </p>
              <a href="#oferta" className="btn btn--ochre">Iniciar Protocolo Personalizado</a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
