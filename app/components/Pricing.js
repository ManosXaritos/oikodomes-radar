'use client';
import { useState } from 'react';
import Link from 'next/link';
import { PLANS, FOUNDING } from '../../lib/plans';

// Plan cards. With `onChoose` they start checkout (inside the app); otherwise they link to sign-up.
export default function Pricing({ onChoose, busy }) {
  const [yearly, setYearly] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="toggle" role="group" aria-label="Τρόπος πληρωμής">
          <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>Μηνιαία</button>
          <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>Ετήσια</button>
        </div>
        <span className="fine">Με ετήσια πληρωμή πληρώνεις 10 μήνες και παίρνεις 12. Οι τιμές δεν περιλαμβάνουν ΦΠΑ 24%.</span>
      </div>
      <div className="plans">
        {Object.entries(PLANS).map(([key, p]) => (
          <div key={key} className={`card plan${p.popular ? ' pop' : ''}`}>
            {p.popular && <span className="tag">Οι περισσότεροι διαλέγουν αυτό</span>}
            <h3>{p.name}</h3>
            <div className="price">
              <span className="num">€{yearly ? p.yearly : p.monthly}</span>/{yearly ? 'χρόνο' : 'μήνα'} + ΦΠΑ
            </div>
            <div className="fine">{yearly ? `δηλαδή €${Math.round((p.yearly / 12) * 10) / 10} τον μήνα` : `ή €${p.yearly} τον χρόνο`}</div>
            <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
            {onChoose ? (
              <button type="button" className={`btn${p.popular ? ' primary' : ''}`} disabled={busy} onClick={() => onChoose(key, yearly ? 'year' : 'month')}>
                Ξεκίνα με {p.name}
              </button>
            ) : (
              <Link className={`btn${p.popular ? ' primary' : ''}`} href={`/login?plan=${key}`}>Δοκίμασε δωρεάν 14 μέρες</Link>
            )}
          </div>
        ))}
      </div>
      <div className="notice">
        <b>Ιδρυτικοί πελάτες:</b> οι πρώτοι {FOUNDING.slots} παίρνουν το Τοπικό με <b>€{FOUNDING.price}/μήνα + ΦΠΑ για πάντα</b>.
        Γράψε τον κωδικό <b className="num">{FOUNDING.code}</b> στην πληρωμή.
      </div>
    </div>
  );
}
