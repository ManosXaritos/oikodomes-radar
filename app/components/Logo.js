import Link from 'next/link';

export default function Logo({ href = '/' }) {
  return (
    <Link href={href} className="logo" aria-label="Νέες Οικοδομές Radar, αρχική">
      <svg width="34" height="34" viewBox="0 0 40 40" aria-hidden="true">
        <rect x="3" y="3" width="34" height="34" rx="8" fill="var(--accent)" />
        <path d="M11 29V18l9-7 9 7v11" fill="none" stroke="var(--on-accent)" strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M17 29v-6h6v6" fill="none" stroke="var(--on-accent)" strokeWidth="2.6" strokeLinejoin="round" />
      </svg>
      <b>Νέες Οικοδομές Radar</b>
    </Link>
  );
}
