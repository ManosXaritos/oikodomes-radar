import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <span>© {new Date().getFullYear()} Νέες Οικοδομές Radar · Δεδομένα από τη Διαύγεια (diavgeia.gov.gr)</span>
        <span style={{ display: 'flex', gap: 14 }}>
          <Link href="/oroi">Όροι χρήσης</Link>
          <Link href="/aporrito">Απόρρητο</Link>
          <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || ''}`}>Επικοινωνία</a>
        </span>
      </div>
    </footer>
  );
}
