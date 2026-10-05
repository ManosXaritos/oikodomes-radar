import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '../../../lib/session';
import { hasAccess } from '../../../lib/plans';
import PlanChooser from './PlanChooser';

export const dynamic = 'force-dynamic';

export default async function PlanPage({ searchParams }) {
  const { user, profile } = await getSession();
  if (!user) redirect('/login?next=/app/plan');
  const active = hasAccess(profile);
  const firstTime = !profile.stripe_subscription_id && !profile.trial_end;
  return (
    <main className="wrap" style={{ paddingBlock: '32px 48px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h1 className="disp" style={{ margin: 0, fontSize: 30 }}>Διάλεξε πακέτο</h1>
        <p className="muted" style={{ margin: '6px 0 0', maxWidth: '62ch' }}>
          {firstTime
            ? 'Οι πρώτες 14 μέρες είναι δωρεάν. Θα σου ζητηθεί κάρτα, αλλά δεν χρεώνεσαι αν ακυρώσεις πριν τελειώσει η δοκιμή.'
            : 'Διάλεξε πακέτο για να συνεχίσεις να βλέπεις τις νέες άδειες.'}
        </p>
      </div>
      {active ? (
        <div className="notice good">
          Έχεις ήδη ενεργή συνδρομή. <Link href="/app">Πήγαινε στον χάρτη</Link> ή άλλαξε πακέτο από τις <Link href="/app/settings">Ρυθμίσεις</Link>.
        </div>
      ) : (
        <PlanChooser preselect={typeof searchParams.choose === 'string' ? searchParams.choose : null} />
      )}
    </main>
  );
}
