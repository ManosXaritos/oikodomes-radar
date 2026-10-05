// Starts a Stripe checkout for the chosen plan. New customers get a 14-day free trial (card required).
import { NextResponse } from 'next/server';
import { getSession } from '../../../lib/session';
import { adminClient } from '../../../lib/supabase/admin';
import { getStripe, siteUrl } from '../../../lib/stripe';
import { PLANS, stripePriceId, hasAccess } from '../../../lib/plans';

export async function POST(request) {
  const { user, profile } = await getSession();
  if (!user) return NextResponse.json({ error: 'Συνδέσου πρώτα.' }, { status: 401 });

  const { plan, interval } = await request.json().catch(() => ({}));
  const price = PLANS[plan] && stripePriceId(plan, interval === 'year' ? 'year' : 'month');
  if (!price) return NextResponse.json({ error: 'Αυτό το πακέτο δεν είναι διαθέσιμο.' }, { status: 400 });
  if (hasAccess(profile)) {
    return NextResponse.json({ error: 'Έχεις ήδη ενεργή συνδρομή. Άλλαξε πακέτο από τις Ρυθμίσεις → Συνδρομή.' }, { status: 409 });
  }

  const stripe = getStripe();
  let customerId = profile.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      preferred_locales: ['el'],
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await adminClient().from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
  }

  // The free trial is only for people who have never had a subscription.
  const firstTime = !profile.stripe_subscription_id && !profile.trial_end;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: user.id,
    // Prices are without VAT; Greek ΦΠΑ 24% is added on top (tax rate created in Stripe).
    line_items: [{ price, quantity: 1, ...(process.env.STRIPE_TAX_RATE_ID ? { tax_rates: [process.env.STRIPE_TAX_RATE_ID] } : {}) }],
    allow_promotion_codes: true,
    payment_method_collection: 'always',
    billing_address_collection: 'required',
    tax_id_collection: { enabled: true },
    customer_update: { name: 'auto', address: 'auto' },
    locale: 'el',
    subscription_data: {
      metadata: { user_id: user.id, plan },
      ...(firstTime ? { trial_period_days: 14 } : {}),
    },
    success_url: `${siteUrl()}/app/settings?welcome=1`,
    cancel_url: `${siteUrl()}/app/plan`,
  });
  return NextResponse.json({ url: session.url });
}
