// Stripe client (server-only).
import Stripe from 'stripe';

let stripe;
export function getStripe() {
  if (!stripe) stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
  return stripe;
}

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
