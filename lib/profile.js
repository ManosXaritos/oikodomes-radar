// Tradesman public profiles: validation helpers shared by the editor, the API and the public page.
import { PRODUCTS } from './classify.js';

const GREEKLISH = {
  α: 'a', ά: 'a', β: 'v', γ: 'g', δ: 'd', ε: 'e', έ: 'e', ζ: 'z', η: 'i', ή: 'i', θ: 'th', ι: 'i', ί: 'i', ϊ: 'i', ΐ: 'i',
  κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'x', ο: 'o', ό: 'o', π: 'p', ρ: 'r', σ: 's', ς: 's', τ: 't', υ: 'y', ύ: 'y', ϋ: 'y', ΰ: 'y',
  φ: 'f', χ: 'ch', ψ: 'ps', ω: 'o', ώ: 'o',
};

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/ου/g, 'ou')
    .replace(/ού/g, 'ou')
    .split('')
    .map((c) => GREEKLISH[c] ?? c)
    .join('')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

const RESERVED = new Set(['app', 'admin', 'api', 'login', 'radar', 'support', 'help', 'oroi', 'aporrito', 'new', 'edit']);
export const validSlug = (s) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s) && s.length >= 3 && s.length <= 60 && !RESERVED.has(s);

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const year = (v, lo, hi) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= lo && n <= hi ? n : null;
};

// Clean what the editor sends before saving.
export function cleanProfile(b) {
  const website = str(b.website, 200);
  return {
    slug: slugify(str(b.slug, 80)),
    name: str(b.name, 120),
    headline: str(b.headline, 160),
    about: str(b.about, 1500),
    trades: (Array.isArray(b.trades) ? b.trades : []).map(String).filter((k) => PRODUCTS[k]).slice(0, 12),
    areas: str(b.areas, 300),
    since_year: year(b.since_year, 1900, new Date().getFullYear()),
    phone: str(b.phone, 30).replace(/[^\d+ ]/g, ''),
    public_email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str(b.public_email, 120)) ? str(b.public_email, 120) : '',
    website: /^https?:\/\/[^\s]+$/i.test(website) ? website : '',
    address: str(b.address, 200),
    tags: (Array.isArray(b.tags) ? b.tags : []).map((t) => str(t, 40)).filter(Boolean).slice(0, 12),
    published: b.published === true,
  };
}

export function cleanWork(b) {
  return {
    title: str(b.title, 140),
    place: str(b.place, 80),
    year: year(b.year, 1950, new Date().getFullYear() + 1),
    category: PRODUCTS[b.category] ? b.category : '',
    via_radar: b.via_radar === true,
  };
}

export const photoUrl = (path) =>
  path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/work-photos/${path.split('/').map(encodeURIComponent).join('/')}` : null;

export const initials = (name) =>
  String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export const telHref = (phone) => `tel:${String(phone).replace(/\s/g, '')}`;
// Viber needs the number with country code, e.g. +3069...
export const viberHref = (phone) => {
  let p = String(phone).replace(/[^\d+]/g, '');
  if (!p.startsWith('+')) p = p.startsWith('30') ? `+${p}` : `+30${p}`;
  return `viber://chat?number=${encodeURIComponent(p)}`;
};
