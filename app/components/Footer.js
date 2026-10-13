import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
  const mail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || '';
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <Logo />
          <p>Οι νέες οικοδομικές άδειες της Ελλάδας, κάθε πρωί, για όσους προμηθεύουν και χτίζουν.</p>
        </div>
        <nav aria-label="Υποσέλιδο" className="footer-links">
          <div>
            <b>Προϊόν</b>
            <Link href="/#times">Τιμές</Link>
            <Link href="/login?plan=region">Δωρεάν δοκιμή</Link>
            <Link href="/login">Σύνδεση</Link>
          </div>
          <div>
            <b>Εταιρεία</b>
            <Link href="/oroi">Όροι χρήσης</Link>
            <Link href="/aporrito">Απόρρητο</Link>
            {mail && <a href={`mailto:${mail}`}>Επικοινωνία</a>}
          </div>
        </nav>
      </div>
      <div className="wrap footer-bottom">
        <span>© {new Date().getFullYear()} Νέες Οικοδομές Radar</span>
        <span>Δεδομένα από τη Διαύγεια (diavgeia.gov.gr)</span>
      </div>
    </footer>
  );
}
