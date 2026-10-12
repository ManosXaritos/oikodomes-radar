import { redirect } from 'next/navigation';
import { getSession } from '../../lib/session';
import { hasAccess, needsSetup, PLANS } from '../../lib/plans';
import Dashboard from './Dashboard';
import { adminClient } from '../../lib/supabase/admin';
import { siteUrl } from '../../lib/stripe';

export const dynamic = 'force-dynamic';

export default async function AppHome({ searchParams }) {
  const { user, profile } = await getSession();
  if (!user) redirect('/login');
  if (!hasAccess(profile)) redirect('/app/plan');
  if (needsSetup(profile)) redirect('/app/settings?setup=1');
  const { data: bp } = await adminClient().from('business_profiles').select('slug,name,headline,published').eq('user_id', user.id).maybeSingle();
  const card = bp && bp.published ? { name: bp.name, headline: bp.headline, url: `${siteUrl()}/m/${bp.slug}` } : null;
  return (
    <Dashboard
      plan={PLANS[profile.plan].name}
      products={profile.products || []}
      status={profile.status}
      trialEnd={profile.trial_end}
      focus={typeof searchParams.p === 'string' ? searchParams.p : null}
      card={card}
    />
  );
}
