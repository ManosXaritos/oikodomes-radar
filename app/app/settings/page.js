import { redirect } from 'next/navigation';
import { getSession } from '../../../lib/session';
import SettingsForm from './SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({ searchParams }) {
  const { user, profile } = await getSession();
  if (!user) redirect('/login?next=/app/settings');
  const welcome = searchParams.welcome === '1' || searchParams.setup === '1';
  return (
    <main className="wrap" style={{ maxWidth: 820, paddingBlock: '28px 48px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <h1 className="disp" style={{ margin: 0, fontSize: 30 }}>Ρυθμίσεις</h1>
      <SettingsForm
        welcome={welcome}
        initial={{
          email: profile.email || user.email,
          business_name: profile.business_name || '',
          plan: profile.plan,
          status: profile.status,
          trial_end: profile.trial_end,
          current_period_end: profile.current_period_end,
          units: profile.units || [],
          regions: profile.regions || [],
          products: profile.products || [],
          digest: profile.digest !== false,
          hasCustomer: !!profile.stripe_customer_id,
        }}
      />
    </main>
  );
}
