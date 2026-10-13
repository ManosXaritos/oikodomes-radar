import Link from 'next/link';
import Logo from './components/Logo';

export const metadata = { title: 'Η σελίδα δεν βρέθηκε · Radar' };

export default function NotFound() {
  return (
    <div className="grid-bg" style={{ minHeight: '100vh' }}>
      <main className="wrap" style={{ maxWidth: 560, paddingBlock: '48px 64px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Logo />
        <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span className="eyebrow">404</span>
          <h1 className="disp" style={{ margin: 0, fontSize: 30 }}>Η σελίδα δεν βρέθηκε.</h1>
          <p className="muted" style={{ margin: 0 }}>Ίσως άλλαξε η διεύθυνση ή η σελίδα δεν είναι πια δημόσια.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn primary" href="/">Αρχική</Link>
            <Link className="btn" href="/app">Ο χάρτης μου</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
