// Engineers who signed up themselves and agreed to be contacted by suppliers:
// the one who declared this permit as theirs, plus others working in the same municipality.
import { NextResponse } from 'next/server';
import { getSession } from '../../../../../lib/session';
import { adminClient } from '../../../../../lib/supabase/admin';
import { hasAccess, inArea } from '../../../../../lib/plans';

export const dynamic = 'force-dynamic';
const FIELDS = 'user_id,name,specialty,office,phone,email,note';

export async function GET(request, { params }) {
  const { user, profile } = await getSession();
  if (!user) return NextResponse.json({ error: 'Συνδέσου πρώτα.' }, { status: 401 });
  if (!hasAccess(profile)) return NextResponse.json({ error: 'Χρειάζεσαι ενεργή συνδρομή.' }, { status: 402 });
  const db = adminClient();
  const ada = decodeURIComponent(params.ada || '');
  const { data: permit } = await db.from('permits').select('municipality_code').eq('ada', ada).eq('hidden', false).maybeSingle();
  if (!permit || !inArea(profile, permit.municipality_code)) return NextResponse.json({ project: [], area: [] });

  const { data: claims } = await db.from('engineer_claims').select('user_id').eq('ada', ada);
  const ids = (claims || []).map((c) => c.user_id);
  const [{ data: project }, { data: area }] = await Promise.all([
    ids.length ? db.from('engineers').select(FIELDS).in('user_id', ids).eq('published', true) : { data: [] },
    permit.municipality_code
      ? db.from('engineers').select(FIELDS).contains('municipalities', [permit.municipality_code]).eq('published', true).limit(6)
      : { data: [] },
  ]);
  const strip = (e) => ({ id: e.user_id, name: e.name, specialty: e.specialty, office: e.office, phone: e.phone, email: e.email, note: e.note });
  return NextResponse.json({
    project: (project || []).map(strip),
    area: (area || []).filter((e) => !ids.includes(e.user_id)).map(strip),
  });
}
