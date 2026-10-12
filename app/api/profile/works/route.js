// Add, edit or remove a finished job on the logged-in customer's profile.
import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/session';
import { adminClient } from '../../../../lib/supabase/admin';
import { cleanWork, photoUrl } from '../../../../lib/profile';

const MAX_WORKS = 24;
const ownPath = (userId, path) => typeof path === 'string' && path.startsWith(`${userId}/`) && /^[0-9a-f-]+\/[0-9a-f-]+\.(jpg|png|webp)$/.test(path);

export async function POST(request) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: 'Συνδέσου πρώτα.' }, { status: 401 });
  const db = adminClient();
  const { data: prof } = await db.from('business_profiles').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!prof) return NextResponse.json({ error: 'Αποθήκευσε πρώτα τα στοιχεία του προφίλ σου.' }, { status: 400 });

  const b = await request.json().catch(() => ({}));
  const w = cleanWork(b);
  if (w.title.length < 2) return NextResponse.json({ error: 'Γράψε έναν τίτλο για τη δουλειά.' }, { status: 400 });
  if (b.photo_path != null && b.photo_path !== '' && !ownPath(user.id, b.photo_path)) return NextResponse.json({ error: 'Η φωτογραφία δεν βρέθηκε.' }, { status: 400 });
  const row = { ...w, photo_path: b.photo_path || null };

  if (b.id) {
    const { data, error } = await db.from('profile_works').update(row).eq('id', String(b.id)).eq('user_id', user.id).select().maybeSingle();
    if (error || !data) return NextResponse.json({ error: 'Δεν αποθηκεύτηκε.' }, { status: 500 });
    return NextResponse.json({ ok: true, work: { ...data, photo: photoUrl(data.photo_path) } });
  }
  const { count } = await db.from('profile_works').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
  if ((count || 0) >= MAX_WORKS) return NextResponse.json({ error: `Μέχρι ${MAX_WORKS} δουλειές ανά προφίλ.` }, { status: 400 });
  const { data, error } = await db.from('profile_works').insert({ ...row, user_id: user.id, sort: count || 0 }).select().single();
  if (error) return NextResponse.json({ error: 'Δεν αποθηκεύτηκε.' }, { status: 500 });
  return NextResponse.json({ ok: true, work: { ...data, photo: photoUrl(data.photo_path) } });
}

export async function DELETE(request) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: 'Συνδέσου πρώτα.' }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const db = adminClient();
  const { data } = await db.from('profile_works').delete().eq('id', String(b.id || '')).eq('user_id', user.id).select('photo_path').maybeSingle();
  if (data?.photo_path) await db.storage.from('work-photos').remove([data.photo_path]);
  return NextResponse.json({ ok: true });
}
