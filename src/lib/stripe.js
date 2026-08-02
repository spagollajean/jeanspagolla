import 'server-only';
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-06-30.basil',
});

// Os 2 planos do Renascer -- Essencial (sem Viora) e Completo (com Viora).
// Precos recorrentes mensais, criados uma vez via API e fixados aqui pra nao
// depender de lookup dinamico por nome a cada checkout.
export const PLANS = {
  essencial: {
    priceId: process.env.STRIPE_PRICE_ID_ESSENCIAL,
    label: 'Renascer Essencial',
    includesViora: false,
  },
  completo: {
    priceId: process.env.STRIPE_PRICE_ID_COMPLETO,
    label: 'Renascer Completo',
    includesViora: true,
  },
};

export function planFromPriceId(priceId) {
  return Object.keys(PLANS).find((key) => PLANS[key].priceId === priceId) || null;
}
