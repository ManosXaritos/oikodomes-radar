'use client';
import { useState } from 'react';

export default function RemovalForm() {
  const [f, setF] = useState({ ada: '', name: '', email: '', reason: '', website: '' });
  const [state, setState] = useState('idle');
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setState('sending');
    const res = await fetch('/api/removal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg(json.found ? 'Η άδεια αφαιρέθηκε από την υπηρεσία μας. Θα σου επιβεβαιώσουμε και με email.' : 'Λάβαμε το αίτημα. Δεν βρήκαμε αυτή την πράξη στη βάση μας, οπότε δεν εμφανίζεται πουθενά στην υπηρεσία. Θα σου απαντήσουμε με email.');
      setState('sent');
    } else {
      setMsg(json.error || 'Δεν στάλθηκε. Δοκίμασε ξανά.');
      setState('error');
    }
  }

  if (state === 'sent') return <div className="notice good" role="status">{msg}</div>;
  return (
    <form onSubmit={submit} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="field"><label htmlFor="r-ada">ΑΔΑ ή link της πράξης στη Διαύγεια</label><input id="r-ada" className="input" required value={f.ada} onChange={set('ada')} placeholder="π.χ. ΨΑ1Β46ΜΤΛΡ-7ΘΔ ή https://diavgeia.gov.gr/doc/…" /></div>
      <div className="field"><label htmlFor="r-name">Ονοματεπώνυμο</label><input id="r-name" className="input" required value={f.name} onChange={set('name')} autoComplete="name" /></div>
      <div className="field"><label htmlFor="r-email">Email για απάντηση</label><input id="r-email" className="input" type="email" required value={f.email} onChange={set('email')} autoComplete="email" /></div>
      <div className="field"><label htmlFor="r-reason">Σχέση με το έργο / λόγος (προαιρετικό)</label><textarea id="r-reason" className="input" rows={3} value={f.reason} onChange={set('reason')} placeholder="π.χ. Είμαι ο ιδιοκτήτης του ακινήτου" /></div>
      <input type="text" name="website" value={f.website} onChange={set('website')} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />
      {state === 'error' && <div className="notice bad">{msg}</div>}
      <button className="btn primary big" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Στέλνουμε…' : 'Αφαίρεση από την υπηρεσία'}</button>
      <span className="fine">Χρησιμοποιούμε τα στοιχεία σου μόνο για να διεκπεραιώσουμε και να τεκμηριώσουμε το αίτημα.</span>
    </form>
  );
}
