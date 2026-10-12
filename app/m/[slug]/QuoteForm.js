'use client';
import { useState } from 'react';

export default function QuoteForm({ slug, name }) {
  const [f, setF] = useState({ name: '', phone: '', email: '', project: 'Νέα πολυκατοικία', area: '', message: '', website: '' });
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setState('sending');
    const res = await fetch('/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, slug }) });
    const json = await res.json().catch(() => ({}));
    if (res.ok) setState('sent');
    else {
      setErr(json.error || 'Δεν στάλθηκε. Δοκίμασε ξανά.');
      setState('error');
    }
  }

  if (state === 'sent') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '6px 0' }}>
        <span style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent)', color: 'var(--on-accent)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 22 }}>✓</span>
        <b className="disp" style={{ fontSize: 20 }}>Το αίτημα στάλθηκε.</b>
        <span className="muted">Η επιχείρηση «{name}» θα επικοινωνήσει μαζί σου.</span>
      </div>
    );
  }
  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <b className="disp" style={{ fontSize: 20 }}>Ζήτα προσφορά</b>
      </div>
      <div className="field"><label htmlFor="q-name">Όνομα</label><input id="q-name" className="input" required value={f.name} onChange={set('name')} autoComplete="name" /></div>
      <div className="field"><label htmlFor="q-phone">Τηλέφωνο</label><input id="q-phone" className="input" type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" placeholder="69…" /></div>
      <div className="field"><label htmlFor="q-email">Email (προαιρετικό)</label><input id="q-email" className="input" type="email" value={f.email} onChange={set('email')} autoComplete="email" /></div>
      <div className="field">
        <label htmlFor="q-project">Ποιο έργο;</label>
        <select id="q-project" className="input" value={f.project} onChange={set('project')}>
          <option>Νέα πολυκατοικία</option><option>Νέα μονοκατοικία</option><option>Ανακαίνιση</option><option>Τουριστικό κατάλυμα</option><option>Επαγγελματικός χώρος</option><option>Άλλο</option>
        </select>
      </div>
      <div className="field"><label htmlFor="q-area">Περιοχή</label><input id="q-area" className="input" value={f.area} onChange={set('area')} placeholder="π.χ. Άλιμος" /></div>
      <div className="field"><label htmlFor="q-msg">Τι χρειάζεστε</label><textarea id="q-msg" className="input" rows={3} value={f.message} onChange={set('message')} placeholder="π.χ. 40 κουφώματα, ανοιγόμενα, θερμοδιακοπή" /></div>
      <input type="text" name="website" value={f.website} onChange={set('website')} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />
      {state === 'error' && <div className="notice bad">{err}</div>}
      <button className="btn primary big" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Στέλνουμε…' : 'Στείλε αίτημα'}</button>
      <span className="fine">Τα στοιχεία σου πηγαίνουν μόνο σε αυτή την επιχείρηση.</span>
    </form>
  );
}
