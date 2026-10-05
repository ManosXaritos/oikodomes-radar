'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PLANS, hasAccess } from '../../../lib/plans';
import { REGIONS, UNITS } from '../../../lib/geo';
import { PRODUCTS } from '../../../lib/classify';

const STATUS = {
  trialing: 'Δωρεάν δοκιμή',
  active: 'Ενεργή',
  past_due: 'Η τελευταία πληρωμή απέτυχε',
  canceled: 'Ακυρωμένη',
  unpaid: 'Απλήρωτη',
  incomplete: 'Δεν ολοκληρώθηκε',
  paused: 'Σε παύση',
};
const date = (d) => (d ? new Date(d).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' }) : '');

export default function SettingsForm({ initial, welcome }) {
  const [s, setS] = useState(initial);
  const [state, setState] = useState('idle'); // idle | saving | saved | error
  const [error, setError] = useState('');
  const plan = PLANS[s.plan];
  const active = hasAccess(s);
  const oneProduct = plan && plan.maxProducts === 1;

  // Right after payment, Stripe's confirmation can take a few seconds to reach us.
  const waiting = welcome && !plan;
  useEffect(() => {
    if (!waiting) return;
    let tries = 0;
    try {
      tries = Number(sessionStorage.getItem('activationTries') || 0);
      sessionStorage.setItem('activationTries', String(tries + 1));
    } catch {}
    if (tries >= 10) return; // stop retrying; the notice tells them to contact us
    const t = setTimeout(() => window.location.reload(), 3000);
    return () => clearTimeout(t);
  }, [waiting]);

  const set = (patch) => {
    setS((x) => ({ ...x, ...patch }));
    setState('idle');
  };
  const toggleProduct = (k) => {
    if (oneProduct) return set({ products: [k] });
    set({ products: s.products.includes(k) ? s.products.filter((x) => x !== k) : [...s.products, k] });
  };

  async function save(e) {
    e.preventDefault();
    setState('saving');
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ units: s.units, regions: s.regions, products: s.products, digest: s.digest, business_name: s.business_name }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || 'Δεν αποθηκεύτηκαν οι ρυθμίσεις.');
      setState('error');
      return;
    }
    setS((x) => ({ ...x, units: json.units ?? x.units, regions: json.regions ?? x.regions, products: json.products ?? x.products }));
    setState('saved');
  }

  async function billing() {
    const res = await fetch('/api/portal', { method: 'POST' });
    const json = await res.json().catch(() => ({}));
    if (json.url) window.location.href = json.url;
    else setError(json.error || 'Δεν άνοιξε η σελίδα συνδρομής.');
  }

  const unitsByRegion = Object.entries(REGIONS)
    .filter(([r]) => r !== '991')
    .map(([r, name]) => [name, Object.entries(UNITS).filter(([, [, rc]]) => rc === r)]);

  const areaMissing = plan && ((plan.scope === 'units' && !s.units.length) || (plan.scope === 'region' && !s.regions.length));
  const productMissing = oneProduct && !s.products.length;

  return (
    <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {waiting && <div className="notice">Ενεργοποιούμε τη συνδρομή σου. Η σελίδα θα ανανεωθεί σε λίγα δευτερόλεπτα. Αν αργεί πάνω από ένα λεπτό, στείλε μας email.</div>}
      {welcome && active && (
        <div className="notice good">
          <b>Καλώς ήρθες!</b> Διάλεξε την περιοχή σου{oneProduct ? ' και τι πουλάς' : ''} και πάτα «Αποθήκευση». Από αύριο το πρωί θα λαμβάνεις τις νέες άδειες στο email σου.
        </div>
      )}

      <section className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 className="disp" style={{ margin: 0, fontSize: 19 }}>Συνδρομή</h2>
        {plan ? (
          <>
            <div>
              Πακέτο <b>{plan.name}</b> · {STATUS[s.status] || s.status}
              {s.status === 'trialing' && s.trial_end && <> · η δοκιμή τελειώνει στις <b>{date(s.trial_end)}</b></>}
              {s.status === 'active' && s.current_period_end && <> · επόμενη χρέωση στις {date(s.current_period_end)}</>}
            </div>
            {s.status === 'past_due' && <div className="notice bad">Η πληρωμή απέτυχε. Άλλαξε κάρτα από το «Διαχείριση συνδρομής» για να μη χάσεις την πρόσβαση.</div>}
          </>
        ) : (
          <div>Δεν έχεις ενεργή συνδρομή. <Link href="/app/plan">Διάλεξε πακέτο</Link></div>
        )}
        {s.hasCustomer && (
          <div>
            <button type="button" className="btn" onClick={billing}>Διαχείριση συνδρομής</button>
            <p className="fine" style={{ margin: '6px 0 0' }}>Εκεί αλλάζεις πακέτο ή κάρτα, βλέπεις αποδείξεις ή ακυρώνεις.</p>
          </div>
        )}
      </section>

      {plan && (
        <section className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 className="disp" style={{ margin: 0, fontSize: 19 }}>Περιοχή</h2>
          {plan.scope === 'units' && (
            <div className="field">
              <label htmlFor="unit">Νομός</label>
              <select id="unit" className="input" value={s.units[0] || ''} onChange={(e) => set({ units: e.target.value ? [e.target.value] : [] })}>
                <option value="">Διάλεξε νομό…</option>
                {unitsByRegion.map(([name, list]) => (
                  <optgroup key={name} label={name}>
                    {list.map(([u, [n]]) => <option key={u} value={u}>{n}</option>)}
                  </optgroup>
                ))}
              </select>
              <span className="fine">Το Τοπικό πακέτο καλύπτει έναν νομό. Για ολόκληρη περιφέρεια, πέρασε στο Περιφέρεια.</span>
            </div>
          )}
          {plan.scope === 'region' && (
            <div className="field">
              <label htmlFor="region">Περιφέρεια</label>
              <select id="region" className="input" value={s.regions[0] || ''} onChange={(e) => set({ regions: e.target.value ? [e.target.value] : [] })}>
                <option value="">Διάλεξε περιφέρεια…</option>
                {Object.entries(REGIONS).filter(([r]) => r !== '991').map(([r, n]) => <option key={r} value={r}>{n}</option>)}
              </select>
            </div>
          )}
          {plan.scope === 'all' && <div>Βλέπεις άδειες από όλη την Ελλάδα.</div>}

          <div className="field">
            <label>{oneProduct ? 'Τι πουλάς (μία κατηγορία)' : 'Τι πουλάς (όσα θέλεις)'}</label>
            <div className="chips">
              {Object.entries(PRODUCTS).map(([k, p]) => (
                <button key={k} type="button" className="chip" aria-pressed={s.products.includes(k)} onClick={() => toggleProduct(k)}>
                  {p.label}
                </button>
              ))}
            </div>
            {!oneProduct && <span className="fine">Αν δεν διαλέξεις τίποτα, βλέπεις όλα τα έργα.</span>}
          </div>
        </section>
      )}

      <section className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h2 className="disp" style={{ margin: 0, fontSize: 19 }}>Λογαριασμός</h2>
        <div className="field">
          <label htmlFor="biz">Επωνυμία επιχείρησης</label>
          <input id="biz" className="input" value={s.business_name} onChange={(e) => set({ business_name: e.target.value })} placeholder="π.χ. Αλουμίνια Παπαδόπουλος" />
        </div>
        <div className="fine">Email: <b>{s.email}</b></div>
        <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input id="digest" type="checkbox" checked={s.digest} onChange={(e) => set({ digest: e.target.checked })} />
          Στείλε μου τις νέες άδειες κάθε πρωί στο email
        </label>
      </section>

      {state === 'error' && <div className="notice bad">{error}</div>}
      {(areaMissing || productMissing) && <div className="notice">Διάλεξε {areaMissing ? 'περιοχή' : ''}{areaMissing && productMissing ? ' και ' : ''}{productMissing ? 'κατηγορία προϊόντος' : ''} για να δεις άδειες.</div>}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn primary big" type="submit" disabled={state === 'saving'}>
          {state === 'saving' ? 'Αποθηκεύουμε…' : 'Αποθήκευση'}
        </button>
        {state === 'saved' && (
          <span>
            Αποθηκεύτηκε. {active && !areaMissing && !productMissing && <Link href="/app">Δες τον χάρτη →</Link>}
          </span>
        )}
      </div>
    </form>
  );
}
