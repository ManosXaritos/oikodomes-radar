'use client';
import { useState } from 'react';
import Link from 'next/link';
import { PLANS, FOUNDING } from '../../lib/plans';

const perMonth = (p) => String(Math.round((p.yearly / 12) * 10) / 10).replace('.', ',');

// Plan cards. With `onChoose` they start checkout (inside the app); otherwise they link to sign-up.
export default function Pricing({ onChoose, busy, center = false }) {
  const [yearly, setYearly] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: center ? 'center' : 'flex-start' }}>
        <div className="toggle" role="group" aria-label="Τρόπος πληρωμής">
          <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>Μηνιαία</button>
          <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>Ετήσια · 2 μήνες δώρο</button>
        </div>
      </div>
      <div className="plans">
        {Object.entries(PLANS).map(([key, p]) => (
          <div key={key} className={`card plan${p.popular ? ' pop' : ''}`}>
            <div className="top">
              <h3>{p.name}</h3>
              {p.popular && <span className="tag">ΔΗΜΟΦΙΛΕΣ</span>}
            </div>
            <span className="blurb">{p.blurb}</span>
            <div className="price">
              <span className="num">€{yearly ? p.yearly : p.monthly}</span>/{yearly ? 'χρόνο' : 'μήνα'} + ΦΠΑ
            </div>
            <div className="fine" style={{ marginTop: -6 }}>{yearly ? `δηλαδή €${perMonth(p)} τον μήνα` : `ή €${p.yearly} τον χρόνο`}</div>
            {onChoose ? (
              <button type="button" className={`btn big${p.popular ? ' primary' : ''}`} disabled={busy} onClick={() => onChoose(key, yearly ? 'year' : 'month')}>
                Ξεκίνα με {p.name}
              </button>
            ) : (
              <Link className={`btn big${p.popular ? ' primary' : ''}`} href={`/login?plan=${key}`}>Ξεκίνα δωρεάν 14 μέρες</Link>
            )}
            <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
          </div>
        ))}
      </div>
      <p style={{ margin: 0, textAlign: center ? 'center' : 'left', color: 'var(--muted)' }}>
        <b style={{ color: 'var(--white)' }}>Ιδρυτικοί πελάτες:</b> οι πρώτοι {FOUNDING.slots} παίρνουν το Τοπικό με €{FOUNDING.price}/μήνα + ΦΠΑ για πάντα · κωδικός{' '}
        <b className="mono" style={{ color: 'var(--accent)' }}>{FOUNDING.code}</b>
      </p>
      <p className="fine" style={{ margin: 0, textAlign: center ? 'center' : 'left' }}>Οι τιμές δεν περιλαμβάνουν ΦΠΑ 24%. Ακυρώνεις όποτε θέλεις.</p>
    </div>
  );
}
