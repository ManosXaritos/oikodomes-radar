// Latest permits for the public home page (titles and municipality only — nothing private).
import { adminClient } from './supabase/admin.js';
import { municipalityName } from './geo.js';

const FALLBACK = [
  { stage: 'ok', date: '2026-10-05', title: 'Νέα διώροφη πολυκατοικία', place: 'Δήμος Σπάτων–Αρτέμιδος' },
  { stage: 'ok', date: '2026-10-05', title: 'Νέα πενταόροφη οικοδομή κατοικιών', place: 'Δήμος Λαρισαίων' },
  { stage: 'pre', date: '2026-10-05', title: 'Νέα εξαόροφη πολυκατοικία', place: 'Δήμος Χαλκιδέων' },
  { stage: 'ok', date: '2026-10-05', title: 'Νέο διώροφο κτίριο 4 κατοικιών', place: 'Δήμος Νάξου' },
  { stage: 'ok', date: '2026-10-05', title: 'Κτίριο τουριστικών κατοικιών', place: 'Δήμος Καλαμάτας' },
];

export async function latestFeed(limit = 5) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('no db');
    const db = adminClient();
    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    const [{ data, error }, { count }] = await Promise.all([
      db.from('permits').select('stage, title, municipality_code, published_at').neq('type', 'reno').order('published_at', { ascending: false }).limit(limit),
      db.from('permits').select('ada', { count: 'exact', head: true }).gte('published_at', since),
    ]);
    if (error || !data || data.length < 3) throw new Error('empty');
    return {
      live: true,
      week: count || 0,
      items: data.map((p) => ({ stage: p.stage, date: p.published_at, title: p.title, place: municipalityName(p.municipality_code) })),
    };
  } catch {
    return { live: false, week: 75, items: FALLBACK };
  }
}
