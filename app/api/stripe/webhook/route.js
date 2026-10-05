// Stripe tells us here when a subscription starts, changes, renews or ends.
import { NextResponse } from 'next/server';
import { getStripe } from '../../../../lib/stripe';
import { adminClient } from '../../../../lib/supabase/admin';
import { planFromPriceId, sanitizeSettings } from '../../../../lib/plans';

export const dynamic = 'force-dynamic';

const toIso = (s) => (s ? new Date(s * 1000).toISOString() : null);

async function syncSubscription(sub, fallbackUserId) {
  const db = adminClient();
  const item = sub.items && sub.items.data && sub.items.data[0];
  const priceId = item && item.price && item.price.id;
  const plan = planFromPriceId(priceId);
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

  let { data: profile } = await db.from('profiles').select('*').eq('stripe_customer_id', customerId).maybeSingle();
  const userId = (profile && profile.id) || (sub.metadata && sub.metadata.user_id) || fallbackUserId;
  if (!profile && userId) {
    ({ data: profile } = await db.from('profiles').select('*').eq('id', userId).maybeSingle());
  }
  if (!profile) {
    console.error('Webhook: no profile for customer', customerId);
    return;
  }

  const ended = sub.status === 'canceled' || sub.status === 'incomplete_expired';
  const newPlan = ended ? null : plan || profile.plan;
  const settings = newPlan
    ? sanitizeSettings(newPlan, { units: profile.units || [], regions: profile.regions || [], products: profile.products || [] })
    : { units: profile.units || [], regions: profile.regions || [], products: profile.products || [] };

  await db
    .from('profiles')
    .update({
      plan: newPlan,
      status: sub.status,
      billing_interval: item && item.price && item.price.recurring ? item.price.recurring.interval : null,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      current_period_end: toIso(sub.current_period_end || (item && item.current_period_end)),
      trial_end: toIso(sub.trial_end) || profile.trial_end,
      ...settings,
    })
    .eq('id', profile.id);
}

export async function POST(request) {
  const stripe = getStripe();
  const body = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, request.headers.get('stripe-signature'), process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Bad signature: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object;
        if (s.mode === 'subscription' && s.subscription) {
          const sub = await stripe.subscriptions.retrieve(s.subscription);
          await syncSubscription(sub, s.client_reference_id);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused':
      case 'customer.subscription.resumed':
        await syncSubscription(event.data.object);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error('Webhook handling failed', err);
    return NextResponse.json({ error: 'handler failed' }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
