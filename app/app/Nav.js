'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  ['/app', 'Χάρτης'],
  ['/app/leads', 'Τα έργα μου'],
  ['/app/profile', 'Το προφίλ μου'],
  ['/app/settings', 'Ρυθμίσεις'],
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Μενού εφαρμογής">
      {LINKS.map(([href, label]) => (
        <Link key={href} className="navlink" href={href} aria-current={(href === '/app' ? path === '/app' : path.startsWith(href)) ? 'page' : undefined}>
          {label}
        </Link>
      ))}
      <span style={{ width: 1, height: 22, background: 'var(--line)', margin: '0 6px' }} />
      <form action="/auth/signout" method="post">
        <button className="navlink" type="submit">Αποσύνδεση</button>
      </form>
    </nav>
  );
}
