// Save the logged-in customer's public profile.
import { NextResponse } from 'next/server';
import { getSession } from '../../../lib/session';
import { adminClient } from '../../../lib/supabase/admin';
import { cleanProfile, validSlug } from '../../../lib/profile';

export async function POST(request) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: 'Συνδέσου πρώτα.' }, { status: 401 });
  const p = cleanProfile(await request.json().catch(() => ({})));
  if (p.name.length < 2) return NextResponse.json({ error: 'Γράψε το όνομα της επιχείρησης.' }, { status: 400 });
  if (!validSlug(p.slug)) return NextResponse.json({ error: 'Η διεύθυνση της σελίδας θέλει 3–60 λατινικά γράμματα ή αριθμούς, π.χ. alouminia-papadopoulos.' }, { status: 400 });
  if (p.published && !p.phone && !p.public_email) return NextResponse.json({ error: 'Για να δημοσιευτεί η σελίδα, βάλε τηλέφωνο ή email.' }, { status: 400 });

  const db = adminClient();
  const { data: taken } = await db.from('business_profiles').select('user_id').eq('slug', p.slug).neq('user_id', user.id).maybeSingle();
  if (taken) return NextResponse.json({ error: 'Αυτή η διεύθυνση σελίδας υπάρχει ήδη. Διάλεξε άλλη.' }, { status: 409 });

  const { error } = await db.from('business_profiles').upsert({ user_id: user.id, ...p, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) return NextResponse.json({ error: 'Δεν αποθηκεύτηκε. Δοκίμασε ξανά.' }, { status: 500 });
  return NextResponse.json({ ok: true, profile: p });
}
