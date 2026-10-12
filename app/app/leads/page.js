import { redirect } from 'next/navigation';
import { getSession } from '../../../lib/session';
import { adminClient } from '../../../lib/supabase/admin';
import { hasAccess } from '../../../lib/plans';
import { municipalityName } from '../../../lib/geo';
import { TYPES } from '../../../lib/classify';
import LeadsBoard from './LeadsBoard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Τα έργα μου · Radar' };

export default async function LeadsPage() {
  const { user, profile } = await getSession();
  if (!user) redirect('/login?next=/app/leads');
  if (!hasAccess(profile)) redirect('/app/plan');
  const db = adminClient();
  const { data: leads } = await db.from('saved_leads').select('ada,status,note,remind_on,amount,updated_at').eq('user_id', user.id).order('updated_at', { ascending: false });
  const adas = (leads || []).map((l) => l.ada);
  const { data: permits } = adas.length
    ? await db.from('permits').select('ada,title,stage,type,municipality_code,published_at').in('ada', adas)
    : { data: [] };
  const byAda = Object.fromEntries((permits || []).map((p) => [p.ada, p]));
  const items = (leads || [])
    .filter((l) => byAda[l.ada])
    .map((l) => {
      const p = byAda[l.ada];
      return { ...l, title: p.title, stage: p.stage, type: TYPES[p.type]?.short || '', place: municipalityName(p.municipality_code), published_at: p.published_at };
    });
  return <LeadsBoard initial={items} />;
}
