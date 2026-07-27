import type { Metadata } from 'next';

// LP de tráfego pago — noindex pra não competir/duplicar com a home no Google.
export const metadata: Metadata = {
  title: 'Viora — Nutri e personal de bolso no WhatsApp por R$ 5',
  description:
    'Tire uma foto do prato e receba calorias e macros em segundos. Avaliação física + plano de treino e dieta em PDF. 1º mês por R$ 5.',
  robots: { index: false, follow: false },
};

export default function LpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
