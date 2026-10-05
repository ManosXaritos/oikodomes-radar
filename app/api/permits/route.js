// The permits a logged-in customer may see (their plan's area), plus the projects they follow.
import { NextResponse } from 'next/server';
import { getSession } from '../../../lib/session';
import { adminClient } from '../../../lib/supabase/admin';
import { hasAccess, allowedUnits, inArea } from '../../../lib/plans';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { user, profile } = await getSession();
  if (!user) return NextResponse.json({ error: 'Συνδέσου πρώτα.' }, { status: 401 });
  if (!hasAccess(profile)) return NextResponse.json({ error: 'Χρειάζεσαι ενεργή συνδρομή.' }, { status: 402 });

  const url = new URL(request.url);
  const days = Math.min(Math.max(Number(url.searchParams.get('days')) || 30, 1), 365);
  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
  const units = allowedUnits(profile);
  const db = adminClient();

  if (units && !units.length) return NextResponse.json({ permits: [], leads: [], places: {} });
  // Supabase returns at most 1000 rows per request, so read in pages (up to 5000 permits).
  const permits = [];
  let error = null;
  for (let from = 0; from < 5000; from += 1000) {
    let q = db
      .from('permits')
      .select('ada,title,stage,type,pool,municipality_code,unit_code,issued_at,published_at,document_url')
      .gte('published_at', since)
      .order('published_at', { ascending: false })
      .range(from, from + 999);
    if (units) q = q.in('unit_code', units);
    const res = await q;
    if (res.error) { error = res.error; break; }
    permits.push(...res.data);
    if (res.data.length < 1000) break;
  }
  if (error) return NextResponse.json({ error: 'Δεν φορτώθηκαν οι άδειες. Δοκίμασε ξανά σε λίγο.' }, { status: 500 });

  const codes = [...new Set((permits || []).map((p) => p.municipality_code).filter(Boolean))];
  const { data: places } = codes.length
    ? await db.from('municipalities').select('code,lat,lon').in('code', codes).not('lat', 'is', null)
    : { data: [] };

  // Followed projects are returned even if they are older than the chosen period.
  const { data: leads } = await db.from('saved_leads').select('ada,status,note,remind_on,updated_at').eq('user_id', user.id);
  const have = new Set((permits || []).map((p) => p.ada));
  const missing = (leads || []).map((l) => l.ada).filter((a) => !have.has(a));
  let extra = [];
  if (missing.length) {
    const { data } = await db.from('permits').select('ada,title,stage,type,pool,municipality_code,unit_code,issued_at,published_at,document_url').in('ada', missing);
    extra = (data || []).filter((p) => inArea(profile, p.municipality_code));
  }

  return NextResponse.json({
    permits: [...(permits || []), ...extra],
    leads: leads || [],
    places: Object.fromEntries((places || []).map((p) => [p.code, [p.lat, p.lon]])),
  });
}
