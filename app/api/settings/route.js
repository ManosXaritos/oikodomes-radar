// Saves a customer's area, products and email preference, within what their plan allows.
import { NextResponse } from 'next/server';
import { getSession } from '../../../lib/session';
import { adminClient } from '../../../lib/supabase/admin';
import { sanitizeSettings } from '../../../lib/plans';

export async function POST(request) {
  const { user, profile } = await getSession();
  if (!user) return NextResponse.json({ error: 'Συνδέσου πρώτα.' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const arr = (x) => (Array.isArray(x) ? x.map(String) : []);
  const settings = profile.plan
    ? sanitizeSettings(profile.plan, { units: arr(body.units), regions: arr(body.regions), products: arr(body.products) })
    : {};
  const update = {
    ...settings,
    digest: body.digest !== false,
    business_name: typeof body.business_name === 'string' ? body.business_name.slice(0, 120) : profile.business_name,
  };
  const { error } = await adminClient().from('profiles').update(update).eq('id', user.id);
  if (error) return NextResponse.json({ error: 'Δεν αποθηκεύτηκαν οι ρυθμίσεις. Δοκίμασε ξανά.' }, { status: 500 });
  return NextResponse.json({ ok: true, ...update });
}
