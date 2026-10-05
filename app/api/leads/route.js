// Follow a project, update its progress and notes, or stop following it.
import { NextResponse } from 'next/server';
import { getSession } from '../../../lib/session';
import { adminClient } from '../../../lib/supabase/admin';
import { hasAccess, inArea } from '../../../lib/plans';

const STATUSES = ['new', 'contacted', 'offer', 'won', 'lost'];

export async function POST(request) {
  const { user, profile } = await getSession();
  if (!user || !hasAccess(profile)) return NextResponse.json({ error: 'Χρειάζεσαι ενεργή συνδρομή.' }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  if (!b.ada) return NextResponse.json({ error: 'Λείπει η άδεια.' }, { status: 400 });
  const { data: permit } = await adminClient().from('permits').select('municipality_code').eq('ada', String(b.ada)).maybeSingle();
  if (!permit) return NextResponse.json({ error: 'Δεν βρέθηκε αυτή η άδεια.' }, { status: 404 });
  if (!inArea(profile, permit.municipality_code)) return NextResponse.json({ error: 'Αυτή η άδεια είναι εκτός της περιοχής του πακέτου σου.' }, { status: 403 });
  const row = {
    user_id: user.id,
    ada: String(b.ada),
    status: STATUSES.includes(b.status) ? b.status : 'new',
    note: typeof b.note === 'string' ? b.note.slice(0, 4000) : '',
    remind_on: /^\d{4}-\d{2}-\d{2}$/.test(b.remind_on || '') ? b.remind_on : null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await adminClient().from('saved_leads').upsert(row, { onConflict: 'user_id,ada' });
  if (error) return NextResponse.json({ error: 'Δεν αποθηκεύτηκε. Δοκίμασε ξανά.' }, { status: 500 });
  return NextResponse.json({ ok: true, lead: row });
}

export async function DELETE(request) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: 'Συνδέσου πρώτα.' }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  await adminClient().from('saved_leads').delete().eq('user_id', user.id).eq('ada', String(b.ada || ''));
  return NextResponse.json({ ok: true });
}
