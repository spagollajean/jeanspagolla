import 'server-only';
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-06-30.basil',
});

// Preco recorrente mensal (Viora PRO Mensal, R$14,99) e cupom do 1o mes
// (R$9,99 off -> R$5,00), criados uma vez via API e fixados aqui pra nao
// depender de lookup dinamico por nome a cada checkout.
export const STRIPE_PRICE_ID_MONTHLY = process.env.STRIPE_PRICE_ID_MONTHLY;
export const STRIPE_COUPON_FIRST_MONTH = process.env.STRIPE_COUPON_FIRST_MONTH;
