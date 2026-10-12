import { notFound } from 'next/navigation';
import { RadarMark } from '../../components/Logo';
import { PRODUCTS } from '../../../lib/classify';
import { loadPublicProfile } from '../../../lib/profileData';
import { initials, telHref, viberHref } from '../../../lib/profile';
import { siteUrl } from '../../../lib/stripe';
import Works from './Works';
import QuoteForm from './QuoteForm';
import s from './profile.module.css';

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const p = await loadPublicProfile(params.slug);
  if (!p) return { title: 'Η σελίδα δεν βρέθηκε' };
  const desc = p.headline || p.about.slice(0, 150) || `${p.name} · επαγγελματικό προφίλ`;
  return {
    title: `${p.name} · Radar`,
    description: desc,
    openGraph: { title: p.name, description: desc, images: p.works.find((w) => w.photo)?.photo ? [p.works.find((w) => w.photo).photo] : [] },
  };
}

export default async function PublicProfile({ params }) {
  const p = await loadPublicProfile(params.slug);
  if (!p) notFound();
  const years = p.since_year ? new Date().getFullYear() - p.since_year : null;
  const trades = p.trades.map((k) => PRODUCTS[k]?.label).filter(Boolean);
  const cats = [...new Set(p.works.map((w) => w.category).filter(Boolean))].map((k) => [k, PRODUCTS[k]?.phase || k]);
  const facts = [
    years != null && years > 0 && [String(years), years === 1 ? 'χρόνος στη δουλειά' : 'χρόνια στη δουλειά'],
    p.works.length > 0 && [String(p.works.length), p.works.length === 1 ? 'δουλειά στη σελίδα' : 'δουλειές στη σελίδα'],
    p.won > 0 && [String(p.won), p.won === 1 ? 'έργο μέσω Radar' : 'έργα μέσω Radar', true],
  ].filter(Boolean);
  const host = siteUrl().replace(/^https?:\/\//, '');

  return (
    <div className={s.page}>
      <div className={s.topbar}>
        <div className="wrap">
          <a href="/" className={s.brand}><RadarMark size={20} /> Επαγγελματικό προφίλ στο <b>Radar</b></a>
          <span className="mono fine">{host}/m/{p.slug}</span>
        </div>
      </div>

      <div className={s.cover} aria-hidden="true">
        <svg width="100%" height="230" viewBox="0 0 1440 230" preserveAspectRatio="xMidYMax slice">
          <g fill="none" stroke="#1F2C26" strokeWidth="1.5">
            <path d="M0 230 V150 H120 V90 H210 V150 H300 V60 H420 V230" />
            <path d="M440 230 V120 H560 V40 H700 V230" />
            <path d="M720 230 V100 H860 V140 H960 V70 H1100 V230" />
            <path d="M1120 230 V130 H1240 V50 H1380 V230" />
          </g>
          <g fill="#3DFFA0" fillOpacity=".5">
            <rect x="580" y="64" width="18" height="24" /><rect x="612" y="64" width="18" height="24" /><rect x="644" y="64" width="18" height="24" />
            <rect x="580" y="104" width="18" height="24" /><rect x="644" y="104" width="18" height="24" />
            <rect x="1260" y="74" width="18" height="24" /><rect x="1292" y="74" width="18" height="24" /><rect x="1324" y="114" width="18" height="24" />
            <rect x="990" y="94" width="18" height="24" /><rect x="1022" y="94" width="18" height="24" />
          </g>
        </svg>
      </div>

      <main className={`wrap ${s.main}`}>
        <div className={s.left}>
          <div className={s.identity}>
            <div className={s.avatar}>{initials(p.name)}</div>
            <div className={s.idText}>
              <h1 className={s.h1}>{p.name}</h1>
              {(p.headline || p.areas) && <span className="muted">{[p.headline, p.areas].filter(Boolean).join(' · ')}</span>}
            </div>
          </div>

          {facts.length > 0 && (
            <div className={s.facts}>
              {facts.map(([v, k, green]) => (
                <div key={k} className="card">
                  <b style={green ? { color: 'var(--accent)' } : undefined}>{v}</b>
                  <span>{k}</span>
                </div>
              ))}
            </div>
          )}

          {(p.about || trades.length > 0 || p.tags.length > 0) && (
            <section className={s.sec}>
              <h2 className={s.h2}>Λίγα λόγια</h2>
              {p.about && <p className={s.about}>{p.about}</p>}
              {(trades.length > 0 || p.tags.length > 0) && (
                <div className="chips">
                  {[...trades, ...p.tags].map((t) => <span key={t} className="chip">{t}</span>)}
                </div>
              )}
            </section>
          )}

          {p.works.length > 0 && (
            <section className={s.sec}>
              <Works works={p.works.map((w) => ({ ...w, catName: PRODUCTS[w.category]?.phase || '' }))} cats={cats} />
            </section>
          )}
        </div>

        <aside className={s.right}>
          <div className={`card ${s.contact}`}>
            <QuoteForm slug={p.slug} name={p.name} />
            {p.phone && (
              <div className={s.quick}>
                <a className="btn" href={telHref(p.phone)}>📞 Κλήση</a>
                <a className="btn" href={viberHref(p.phone)}>💬 Viber</a>
              </div>
            )}
          </div>
          <div className={`card ${s.details}`}>
            <b>Στοιχεία επιχείρησης</b>
            {p.phone && <span>Τηλ. <a href={telHref(p.phone)}>{p.phone}</a></span>}
            {p.public_email && <span><a href={`mailto:${p.public_email}`}>{p.public_email}</a></span>}
            {p.website && <span><a href={p.website} target="_blank" rel="noopener noreferrer nofollow">{p.website.replace(/^https?:\/\//, '')}</a></span>}
            {p.address && <span>{p.address}</span>}
            {p.areas && <span>Εξυπηρετεί: {p.areas}</span>}
            {p.since_year && <span>Από το {p.since_year}</span>}
          </div>
          <p className="fine" style={{ margin: 0 }}>Τα στοιχεία της σελίδας τα συμπληρώνει η ίδια η επιχείρηση.</p>
        </aside>
      </main>
    </div>
  );
}
