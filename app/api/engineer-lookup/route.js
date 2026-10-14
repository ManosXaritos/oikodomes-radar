// A subscriber typed (or pasted) the engineer's name from the permit. We search Google's public
// business listings for that engineering office and return its business phone.
// Nothing is stored: not the name, not the results (Google's terms also forbid caching them).
import { NextResponse } from 'next/server';
import { getSession } from '../../../lib/session';
import { adminClient } from '../../../lib/supabase/admin';
import { hasAccess } from '../../../lib/plans';
import { municipalityName } from '../../../lib/geo';

export const dynamic = 'force-dynamic';
const DAILY = 40;

export async function POST(request) {
  const { user, profile } = await getSession();
  if (!user) return NextResponse.json({ error: 'Συνδέσου πρώτα.' }, { status: 401 });
  if (!hasAccess(profile)) return NextResponse.json({ error: 'Χρειάζεσαι ενεργή συνδρομή.' }, { status: 402 });
  const b = await request.json().catch(() => ({}));
  const name = String(b.name || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  if (name.length < 3) return NextResponse.json({ error: 'Γράψε το όνομα του μηχανικού.' }, { status: 400 });

  const db = adminClient();
  const { data: permit } = await db.from('permits').select('municipality_code').eq('ada', String(b.ada || '')).eq('hidden', false).maybeSingle();
  const place = permit ? municipalityName(permit.municipality_code).replace(/^Δήμος\s+/, '') : '';
  const fallback = `https://www.google.com/search?q=${encodeURIComponent(`${name} μηχανικός ${place} τηλέφωνο`)}`;

  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) return NextResponse.json({ results: [], fallback, reason: 'nokey' });

  const { count } = await db.from('lookup_log').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', new Date(Date.now() - 864e5).toISOString());
  if ((count || 0) >= DAILY) return NextResponse.json({ results: [], fallback, reason: 'limit' });
  await db.from('lookup_log').insert({ user_id: user.id });

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.googleMapsUri,places.primaryTypeDisplayName',
    },
    body: JSON.stringify({ textQuery: `${name} μηχανικός ${place}`.trim(), languageCode: 'el', regionCode: 'GR', pageSize: 4 }),
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return NextResponse.json({ results: [], fallback, reason: 'error' });
  const json = await res.json().catch(() => ({}));
  const results = (json.places || [])
    .filter((p) => p.nationalPhoneNumber)
    .slice(0, 3)
    .map((p) => ({
      id: p.id,
      name: p.displayName?.text || '',
      type: p.primaryTypeDisplayName?.text || '',
      address: p.formattedAddress || '',
      phone: p.nationalPhoneNumber,
      maps: p.googleMapsUri || '',
    }));
  return NextResponse.json({ results, fallback });
}
