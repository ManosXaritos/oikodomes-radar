// Opens Stripe's own page where the customer changes plan, updates the card, sees invoices or cancels.
import { NextResponse } from 'next/server';
import { getSession } from '../../../lib/session';
import { getStripe, siteUrl } from '../../../lib/stripe';

export async function POST() {
  const { user, profile } = await getSession();
  if (!user) return NextResponse.json({ error: 'Συνδέσου πρώτα.' }, { status: 401 });
  if (!profile.stripe_customer_id) return NextResponse.json({ error: 'Δεν υπάρχει συνδρομή ακόμα.' }, { status: 400 });
  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${siteUrl()}/app/settings`,
    locale: 'el',
  });
  return NextResponse.json({ url: session.url });
}
