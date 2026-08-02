// Google Analytics 4 — wrapper seguro: no-op no servidor ou se o script não
// carregou (adblock). ID em NEXT_PUBLIC_GA_MEASUREMENT_ID.
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

export function gtag(...args) {
  if (typeof window === 'undefined') return;
  const w = window;
  if (typeof w.gtag === 'function') w.gtag(...args);
}

/** Compra confirmada — espelha o Purchase do Meta Pixel. */
export function gaPurchase(value, label) {
  gtag('event', 'purchase', {
    value,
    currency: 'BRL',
    transaction_id: `${label}-${Date.now()}`,
    items: [{ item_name: label }],
  });
}
