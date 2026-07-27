// Meta Pixel — wrapper seguro: no-op no servidor ou se o script não carregou
// (adblock). ID fica em NEXT_PUBLIC_META_PIXEL_ID pra trocar sem deploy de código.
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

type FbqArgs = [string, string, Record<string, unknown>?];

export function fbq(...args: FbqArgs) {
  if (typeof window === 'undefined') return;
  const f = (window as any).fbq;
  if (typeof f === 'function') f(...args);
}

/** Evento padrão de compra — usado no sucesso do cartão e do Pix. */
export function trackPurchase(value: number, metadata?: Record<string, unknown>) {
  fbq('track', 'Purchase', { value, currency: 'BRL', ...metadata });
}
