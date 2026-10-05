// Subscription plans and what each one may see.
import { UNITS, unitOf, regionOf } from './geo.js';
import { PRODUCTS } from './classify.js';

export const PLANS = {
  local: {
    name: 'Τοπικό',
    monthly: 29,
    yearly: 290,
    blurb: '1 νομός, 1 κατηγορία προϊόντος',
    features: ['1 νομός', '1 κατηγορία προϊόντος', 'Νέες άδειες κάθε πρωί στο email σου', 'Χάρτης και λίστα στο κινητό'],
    maxUnits: 1,
    maxProducts: 1,
    scope: 'units',
  },
  region: {
    name: 'Περιφέρεια',
    monthly: 49,
    yearly: 490,
    blurb: 'Ολόκληρη περιφέρεια, όλες οι κατηγορίες',
    features: ['Ολόκληρη περιφέρεια, π.χ. όλη η Αττική', 'Όλες οι κατηγορίες προϊόντων', 'Λίστα με τα έργα που παρακολουθείς', 'Υπενθύμιση για το σωστό χρονικό σημείο'],
    maxRegions: 1,
    maxProducts: Infinity,
    scope: 'region',
    popular: true,
  },
  pro: {
    name: 'Επαγγελματικό',
    monthly: 89,
    yearly: 890,
    blurb: 'Όλη η Ελλάδα, για πολλά καταστήματα',
    features: ['Όλη η Ελλάδα', 'Όλες οι κατηγορίες προϊόντων', 'Για πολλά καταστήματα ή πωλητές', 'Όλα τα παραπάνω'],
    maxProducts: Infinity,
    scope: 'all',
  },
};

export const FOUNDING = { price: 19, slots: 10, code: 'IDRYTIKOS' };

// Stripe price ids come from environment variables (see .env.example).
export function stripePriceId(plan, interval) {
  const key = `STRIPE_PRICE_${plan.toUpperCase()}_${interval === 'year' ? 'YEARLY' : 'MONTHLY'}`;
  return process.env[key] || null;
}

export function planFromPriceId(priceId) {
  for (const plan of Object.keys(PLANS)) {
    for (const interval of ['month', 'year']) {
      if (stripePriceId(plan, interval) === priceId) return plan;
    }
  }
  return null;
}

export const ACTIVE_STATUSES = ['trialing', 'active', 'past_due'];
export const hasAccess = (profile) => !!profile && !!profile.plan && ACTIVE_STATUSES.includes(profile.status);

// Clean a user's chosen areas/products so they never exceed their plan.
export function sanitizeSettings(plan, { units = [], regions = [], products = [] }) {
  const p = PLANS[plan];
  if (!p) return { units: [], regions: [], products: [] };
  const validProducts = products.filter((x) => PRODUCTS[x]);
  const out = { units: [], regions: [], products: validProducts.slice(0, p.maxProducts === Infinity ? undefined : p.maxProducts) };
  if (p.scope === 'units') out.units = units.filter((u) => UNITS[u]).slice(0, p.maxUnits);
  if (p.scope === 'region') out.regions = regions.filter((r) => Object.values(UNITS).some(([, rc]) => rc === r)).slice(0, p.maxRegions);
  return out;
}

// Does this permit fall inside the areas the user may see?
export function inArea(profile, municipalityCode) {
  const p = PLANS[profile.plan];
  if (!p) return false;
  if (p.scope === 'all') return true;
  if (!municipalityCode) return false;
  if (p.scope === 'units') return (profile.units || []).includes(unitOf(municipalityCode));
  if (p.scope === 'region') return (profile.regions || []).includes(regionOf(municipalityCode));
  return false;
}

// The 2-digit unit codes a user may see, for database filtering (null = everything).
export function allowedUnits(profile) {
  const p = PLANS[profile.plan];
  if (!p) return [];
  if (p.scope === 'all') return null;
  if (p.scope === 'units') return (profile.units || []).filter((u) => UNITS[u]);
  const regions = profile.regions || [];
  return Object.entries(UNITS)
    .filter(([, [, rc]]) => regions.includes(rc))
    .map(([u]) => u);
}

export const needsSetup = (profile) => {
  const p = PLANS[profile.plan];
  if (!p) return false;
  if (p.scope === 'units' && !(profile.units || []).length) return true;
  if (p.scope === 'region' && !(profile.regions || []).length) return true;
  if (p.maxProducts === 1 && !(profile.products || []).length) return true;
  return false;
};
