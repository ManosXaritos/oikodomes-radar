// Finds map coordinates for a municipality using OpenStreetMap's free search (Nominatim).
// Their rules: at most 1 request per second and a User-Agent with contact details. We only ever
// look up each municipality once and store the result, so this stays far below their limits.
import { geocodeQuery, MUNICIPALITIES } from './geo.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function geocodeMunicipality(code, { fetchImpl = fetch, contact = '' } = {}) {
  const queries = [geocodeQuery(code), MUNICIPALITIES[code] && `${MUNICIPALITIES[code]}, Ελλάδα`].filter(Boolean);
  for (const q of queries) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=gr&accept-language=el&q=${encodeURIComponent(q)}`;
    const res = await fetchImpl(url, { headers: { 'User-Agent': `OikodomesRadar/1.0 (${contact})` }, cache: 'no-store' });
    if (res.ok) {
      const list = await res.json();
      if (list && list[0]) return { lat: Number(list[0].lat), lon: Number(list[0].lon) };
    }
    await sleep(1100);
  }
  return null;
}

export async function geocodeMissing(db, { limit = 20, contact = '', deadline = Infinity } = {}) {
  const { data: rows } = await db.from('permits').select('municipality_code').not('municipality_code', 'is', null).order('published_at', { ascending: false }).limit(1000);
  const codes = [...new Set((rows || []).map((r) => r.municipality_code))];
  if (!codes.length) return 0;
  const { data: known } = await db.from('municipalities').select('code').in('code', codes).not('geocoded_at', 'is', null);
  const have = new Set((known || []).map((k) => k.code));
  const todo = codes.filter((c) => !have.has(c) && MUNICIPALITIES[c]).slice(0, limit);
  let done = 0;
  for (const code of todo) {
    if (Date.now() > deadline) break; // the rest is done tomorrow
    const pos = await geocodeMunicipality(code, { contact });
    await db.from('municipalities').upsert({ code, lat: pos ? pos.lat : null, lon: pos ? pos.lon : null, geocoded_at: new Date().toISOString() });
    if (pos) done++;
    await sleep(1100);
  }
  return done;
}
