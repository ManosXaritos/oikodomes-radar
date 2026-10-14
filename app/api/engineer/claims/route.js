// An engineer marks permits as their own projects, so suppliers see "the project's engineer".
import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/session';
import { adminClient } from '../../../../lib/supabase/admin';

function adaFrom(input) {
  const s = String(input || '').trim().slice(0, 300);
  const m = s.match(/diavgeia\.gov\.gr\/(?:doc|decision\/view)\/([^/?#\s]+)/i);
  return decodeURIComponent(m ? m[1] : s).trim().toUpperCase().replace(/\s+/g, '');
}

export async function POST(request) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: 'Συνδέσου πρώτα.' }, { status: 401 });
  const db = adminClient();
  const { data: me } = await db.from('engineers').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!me) return NextResponse.json({ error: 'Αποθήκευσε πρώτα τα στοιχεία σου.' }, { status: 400 });
  const b = await request.json().catch(() => ({}));
  const adas = [...new Set(String(b.links || '').split(/[\s,;]+/).filter(Boolean).map(adaFrom))].filter((a) => /^[0-9A-ZΑ-Ω-]{6,40}$/u.test(a)).slice(0, 50);
  if (!adas.length) return NextResponse.json({ error: 'Επικόλλησε έναν ΑΔΑ ή link της Διαύγειας.' }, { status: 400 });
  const { count } = await db.from('engineer_claims').select('ada', { count: 'exact', head: true }).eq('user_id', user.id);
  if ((count || 0) + adas.length > 1000) return NextResponse.json({ error: 'Έφτασες το όριο των έργων.' }, { status: 400 });
  const { data: found } = await db.from('permits').select('ada,title').in('ada', adas).eq('hidden', false);
  const ok = (found || []).map((p) => p.ada);
  if (ok.length) await db.from('engineer_claims').upsert(ok.map((ada) => ({ ada, user_id: user.id })), { onConflict: 'ada,user_id', ignoreDuplicates: true });
  return NextResponse.json({ added: found || [], missing: adas.filter((a) => !ok.includes(a)) });
}

export async function DELETE(request) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: 'Συνδέσου πρώτα.' }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  await adminClient().from('engineer_claims').delete().eq('user_id', user.id).eq('ada', String(b.ada || ''));
  return NextResponse.json({ ok: true });
}
