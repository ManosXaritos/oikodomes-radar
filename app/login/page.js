import Logo from '../components/Logo';
import LoginForm from './LoginForm';

export const metadata = { title: 'Σύνδεση · Νέες Οικοδομές Radar' };

export default function LoginPage({ searchParams }) {
  const next = typeof searchParams.next === 'string' && searchParams.next.startsWith('/') && !searchParams.next.startsWith('//') && !searchParams.next.startsWith('/\\') ? searchParams.next : '/app';
  const plan = typeof searchParams.plan === 'string' ? searchParams.plan : '';
  const error = searchParams.error === 'link';
  return (
    <div className="grid-bg" style={{ minHeight: '100vh' }}>
      <main className="wrap" style={{ maxWidth: 480, paddingBlock: '48px 64px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Logo />
        <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18, borderColor: 'rgba(61,255,160,.3)', boxShadow: '0 0 60px rgba(61,255,160,.08)' }}>
          <div>
            <h1 className="disp" style={{ margin: 0, fontSize: 28 }}>{plan ? 'Ξεκίνα δωρεάν' : 'Καλώς ήρθες'}</h1>
            <p className="muted" style={{ margin: '6px 0 0' }}>{plan ? '14 μέρες δωρεάν. Φτιάξε λογαριασμό σε 30 δευτερόλεπτα.' : 'Μπες με Google ή με το email και τον κωδικό σου.'}</p>
          </div>
          {error && <div className="notice bad">Η σύνδεση δεν ολοκληρώθηκε. Δοκίμασε ξανά.</div>}
          <LoginForm next={plan ? `/app/plan?choose=${encodeURIComponent(plan)}` : next} startMode={plan ? 'signup' : 'signin'} />
        </div>
      </main>
    </div>
  );
}
