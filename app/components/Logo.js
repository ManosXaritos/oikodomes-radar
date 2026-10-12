import Link from 'next/link';

export function RadarMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
      <circle cx="17" cy="17" r="15" fill="none" stroke="#3DFFA0" strokeOpacity=".35" strokeWidth="1.5" />
      <circle cx="17" cy="17" r="9" fill="none" stroke="#3DFFA0" strokeOpacity=".6" strokeWidth="1.5" />
      <path d="M17 17 L30 9" stroke="#3DFFA0" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="24" cy="12.5" r="2.6" fill="#3DFFA0" />
      <circle cx="17" cy="17" r="2.2" fill="#FFFFFF" />
    </svg>
  );
}

export default function Logo({ href = '/', short = false }) {
  return (
    <Link href={href} className="logo" aria-label="Νέες Οικοδομές Radar, αρχική">
      <RadarMark />
      <b>{short ? <span>Radar</span> : <>Νέες Οικοδομές <span>Radar</span></>}</b>
    </Link>
  );
}
