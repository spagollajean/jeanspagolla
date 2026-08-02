// Meta Pixel — wrapper seguro: no-op no servidor ou se o script não carregou
// (adblock). ID fica em NEXT_PUBLIC_META_PIXEL_ID pra trocar sem deploy de código.
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

export function fbq(...args) {
  if (typeof window === 'undefined') return;
  const f = window.fbq;
  if (typeof f === 'function') f(...args);
}

/** Evento padrão de compra. */
export function trackPurchase(value, metadata) {
  fbq('track', 'Purchase', { value, currency: 'BRL', ...metadata });
}
