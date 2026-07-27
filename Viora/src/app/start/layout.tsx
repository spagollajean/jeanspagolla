import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Viora — Nutricionista e Personal no WhatsApp por R$ 5',
  description:
    'Tire uma foto do prato e receba calorias e macros na hora. Dieta e treino personalizados analisando uma foto sua. Experimente por R$ 5 no primeiro mês.',
  robots: 'index, follow',
  openGraph: {
    title: 'Viora — Nutricionista e Personal no WhatsApp por R$ 5',
    description: 'Foto do prato → calorias na hora. Foto sua → dieta e treino em PDF. Tudo no WhatsApp.',
    images: ['/lp/card-comida.png'],
  },
};

export default function StartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
