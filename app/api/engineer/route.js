// An engineer's own listing: create/update (with explicit consent), or delete it entirely.
import { NextResponse } from 'next/server';
import { getSession } from '../../../lib/session';
import { adminClient } from '../../../lib/supabase/admin';
import { MUNICIPALITIES } from '../../../lib/geo';

const str = (v, max) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

export async function POST(request) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: 'Συνδέσου πρώτα.' }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  if (b.consent !== true) return NextResponse.json({ error: 'Χρειάζεται να συμφωνήσεις ότι τα στοιχεία σου θα εμφανίζονται στους συνδρομητές.' }, { status: 400 });
  const row = {
    user_id: user.id,
    name: str(b.name, 100),
    specialty: str(b.specialty, 80),
    office: str(b.office, 120),
    phone: str(b.phone, 30).replace(/[^\d+ ]/g, ''),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str(b.email, 120)) ? str(b.email, 120) : null,
    municipalities: (Array.isArray(b.municipalities) ? b.municipalities : []).map(String).filter((c) => MUNICIPALITIES[c]).slice(0, 30),
    note: str(b.note, 300),
    published: b.published !== false,
    consent_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (row.name.length < 3) return NextResponse.json({ error: 'Γράψε το ονοματεπώνυμό σου.' }, { status: 400 });
  if (row.phone.replace(/\D/g, '').length < 10) return NextResponse.json({ error: 'Γράψε ένα τηλέφωνο επικοινωνίας.' }, { status: 400 });
  const { error } = await adminClient().from('engineers').upsert(row, { onConflict: 'user_id' });
  if (error) return NextResponse.json({ error: 'Δεν αποθηκεύτηκε. Δοκίμασε ξανά.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: 'Συνδέσου πρώτα.' }, { status: 401 });
  await adminClient().from('engineers').delete().eq('user_id', user.id); // claims go with it (cascade)
  return NextResponse.json({ ok: true });
}
