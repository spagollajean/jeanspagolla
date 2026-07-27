// Google Analytics 4 — wrapper seguro: no-op no servidor ou se o script não
// carregou (adblock). ID em NEXT_PUBLIC_GA_MEASUREMENT_ID.
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

export function gtag(...args: unknown[]) {
  if (typeof window === 'undefined') return;
  const w = window as any;
  if (typeof w.gtag === 'function') w.gtag(...args);
}

/** Compra confirmada — espelha o Purchase do Meta Pixel (cartão e Pix). */
export function gaPurchase(value: number, label: string) {
  gtag('event', 'purchase', {
    value,
    currency: 'BRL',
    transaction_id: `${label}-${Date.now()}`,
    items: [{ item_name: label }],
  });
}
