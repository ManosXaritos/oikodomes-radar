import Link from 'next/link';
import Logo from '../components/Logo';

export const metadata = { title: 'Οι άδειές μου · Νέες Οικοδομές Radar' };

export default function AppLayout({ children }) {
  return (
    <>
      <header className="bar">
        <div className="wrap" style={{ maxWidth: 1480 }}>
          <Logo href="/app" />
          <nav className="nav">
            <Link className="btn" href="/app">Χάρτης</Link>
            <Link className="btn" href="/app/settings">Ρυθμίσεις</Link>
            <form action="/auth/signout" method="post">
              <button className="btn" type="submit">Αποσύνδεση</button>
            </form>
          </nav>
        </div>
      </header>
      {children}
    </>
  );
}
