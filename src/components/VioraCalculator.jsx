'use client';

import { useState } from 'react';

export default function VioraCalculator() {
  const [age, setAge] = useState(35);
  const [weight, setWeight] = useState(78);
  const [height, setHeight] = useState(172);
  const [gender, setGender] = useState('female');
  const [activity, setActivity] = useState(1.375);
  const [showResult, setShowResult] = useState(true);

  // Calculations (Mifflin-St Jeor)
  let bmr = (10 * (parseFloat(weight) || 70)) + (6.25 * (parseFloat(height) || 170)) - (5 * (parseFloat(age) || 30));
  if (gender === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  const tdee = Math.round(bmr * parseFloat(activity));
  const deficitCalories = Math.round(tdee * 0.8);
  const waterLiters = ((parseFloat(weight) || 70) * 0.035).toFixed(1);

  return (
    <section className="section-dark pad" id="calculadora">
      <div className="wrap">
        <div className="section-head text-center">
          <span className="eyebrow" style={{ color: 'var(--viora-emerald)' }}>Simulador de Metabolismo</span>
          <h2 style={{ color: 'var(--bone)' }}>
            Calculadora Metabólica <span style={{ color: 'var(--viora-emerald)', whiteSpace: 'nowrap' }}>Viora AI</span>
          </h2>
          <p style={{ color: 'var(--bone-soft)' }}>
            Insira suas métricas biológicas para simular em tempo real suas metas de calorias, taxa metabólica e desintoxicação.
          </p>
        </div>

        <div className="calc-card-widget">
          <div className="calc-grid-form">
            <div>
              <label htmlFor="calcAge" className="calc-label">Idade (anos)</label>
              <input type="number" id="calcAge" className="calc-input" value={age} onChange={e => setAge(e.target.value)} min="18" max="80" />
            </div>
            <div>
              <label htmlFor="calcWeight" className="calc-label">Peso Atual (kg)</label>
              <input type="number" id="calcWeight" className="calc-input" value={weight} onChange={e => setWeight(e.target.value)} min="40" max="200" />
            </div>
            <div>
              <label htmlFor="calcHeight" className="calc-label">Altura (cm)</label>
              <input type="number" id="calcHeight" className="calc-input" value={height} onChange={e => setHeight(e.target.value)} min="130" max="220" />
            </div>
            <div>
              <label htmlFor="calcGender" className="calc-label">Gênero</label>
              <select id="calcGender" className="calc-input" value={gender} onChange={e => setGender(e.target.value)}>
                <option value="female">Feminino</option>
                <option value="male">Masculino</option>
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label htmlFor="calcActivity" className="calc-label">Nível de Atividade Biológica</label>
              <select id="calcActivity" className="calc-input" value={activity} onChange={e => setActivity(e.target.value)}>
                <option value="1.2">Sedentário (pouco ou nenhum exercício)</option>
                <option value="1.375">Levemente Ativo (exercício 1-3x/semana)</option>
                <option value="1.55">Moderadamente Ativo (exercício 3-5x/semana)</option>
              </select>
            </div>
          </div>

          <button className="btn btn--viora btn--block" onClick={() => setShowResult(true)} style={{ marginTop: '1.4rem' }}>
            Simular com Inteligência Viora AI
          </button>

          {showResult && (
            <div className="calc-dashboard">
              <div className="calc-stat">
                <div className="number">{Math.round(bmr)}</div>
                <div className="label">kcal (Taxa Basal)</div>
              </div>
              <div className="calc-stat">
                <div className="number">{tdee}</div>
                <div className="label">kcal (Gasto Diário)</div>
              </div>
              <div className="calc-stat">
                <div className="number">{deficitCalories}</div>
                <div className="label">kcal (Déficit)</div>
              </div>
              <div className="calc-stat">
                <div className="number">{waterLiters} L</div>
                <div className="label">Hidratação / dia</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
