import Logo from '../components/Logo';
import LoginForm from './LoginForm';

export const metadata = { title: 'Σύνδεση · Νέες Οικοδομές Radar' };

export default function LoginPage({ searchParams }) {
  const next = typeof searchParams.next === 'string' && searchParams.next.startsWith('/') && !searchParams.next.startsWith('//') && !searchParams.next.startsWith('/\\') ? searchParams.next : '/app';
  const plan = typeof searchParams.plan === 'string' ? searchParams.plan : '';
  const error = searchParams.error === 'link';
  return (
    <main className="wrap" style={{ maxWidth: 460, paddingBlock: '48px 64px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Logo />
      <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h1 className="disp" style={{ margin: 0, fontSize: 26 }}>Σύνδεση ή εγγραφή</h1>
          <p className="muted" style={{ margin: '6px 0 0' }}>
            Γράψε το email σου και θα σου στείλουμε έναν σύνδεσμο. Δεν χρειάζεσαι κωδικό.
          </p>
        </div>
        {error && <div className="notice bad">Ο σύνδεσμος έληξε ή χρησιμοποιήθηκε ήδη. Ζήτησε νέο παρακάτω.</div>}
        <LoginForm next={plan ? `/app/plan?choose=${encodeURIComponent(plan)}` : next} />
      </div>
    </main>
  );
}
