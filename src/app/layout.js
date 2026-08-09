import './globals.css';
import { MetaPixel } from '@/components/MetaPixel';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';

export const metadata = {
  metadataBase: new URL('https://www.jeanspagolla.com.br'),
  title: 'Renascer + Viora AI: Desinflame seu corpo, recupere sua energia e sua fé em 30 dias',
  description: 'Protocolo completo de desintoxicação, treino e mentalidade por Jean (Fitness & Wellness e Terapeuta) com inteligência nutricional e calórica do ecossistema Viora.',
  keywords: ['desinflamação', 'renascer', 'viora', 'dieta', 'treino', 'calorias', 'saúde', 'terapia'],
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://www.jeanspagolla.com.br',
  },
  openGraph: {
    title: 'Renascer + Viora AI: Protocolo Anti-inflamatório de 30 Dias',
    description: 'Recupere sua saúde, vitalidade e fé sem remédios ou dietas restritivas.',
    url: 'https://www.jeanspagolla.com.br',
    siteName: 'Renascer',
    type: 'website',
    locale: 'pt_BR',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Renascer — Desinflame seu corpo, recupere sua energia e sua fé em 30 dias',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Renascer + Viora AI: Protocolo Anti-inflamatório de 30 Dias',
    description: 'Recupere sua saúde, vitalidade e fé sem remédios ou dietas restritivas.',
    images: ['/og-image.jpg'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Renascer',
  description: 'Protocolo de desintoxicação, desinflamação, treino e mentalidade com acompanhamento direto, por Jean, Fitness & Wellness e Terapeuta.',
  url: 'https://www.jeanspagolla.com.br',
  image: 'https://www.jeanspagolla.com.br/og-image.jpg',
  provider: {
    '@type': 'Person',
    name: 'Jean',
    jobTitle: 'Fitness & Wellness e Terapeuta',
  },
  areaServed: 'BR',
  offers: [
    {
      '@type': 'Offer',
      name: 'Renascer Essencial',
      price: '59.90',
      priceCurrency: 'BRL',
      url: 'https://www.jeanspagolla.com.br/#oferta',
    },
    {
      '@type': 'Offer',
      name: 'Renascer Completo',
      price: '79.90',
      priceCurrency: 'BRL',
      url: 'https://www.jeanspagolla.com.br/#oferta',
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
        <MetaPixel />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
