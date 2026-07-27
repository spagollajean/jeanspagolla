import './globals.css';

export const metadata = {
  title: 'Renascer + Viora AI: Desinflame seu corpo, recupere sua energia e sua fé em 30 dias',
  description: 'Protocolo completo de desintoxicação, treino e mentalidade por Jean (Personal Trainer e Terapeuta) com inteligência nutricional e calórica do ecossistema Viora.',
  keywords: ['desinflamação', 'renascer', 'viora', 'dieta', 'treino', 'calorias', 'saúde', 'terapia'],
  openGraph: {
    title: 'Renascer + Viora AI: Protocolo Anti-inflamatório de 30 Dias',
    description: 'Recupere sua saúde, vitalidade e fé sem remédios ou dietas restritivas.',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
