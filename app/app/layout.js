import Logo from '../components/Logo';
import Nav from './Nav';

export const metadata = { title: 'Radar · Νέες Οικοδομές' };

export default function AppLayout({ children }) {
  return (
    <>
      <header className="bar">
        <div className="wrap" style={{ maxWidth: 1480 }}>
          <Logo href="/app" short />
          <Nav />
        </div>
      </header>
      {children}
    </>
  );
}
