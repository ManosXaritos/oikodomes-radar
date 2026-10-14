'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MUNICIPALITIES } from '../../lib/geo';
import { norm } from '../../lib/classify';

const ALL = Object.entries(MUNICIPALITIES).map(([code, name]) => ({ code, name, key: norm(name) }));

export default function EngineerEditor({ initial, initialClaims, email }) {
  const [f, setF] = useState({
    name: initial?.name || '',
    specialty: initial?.specialty || 'Πολιτικός μηχανικός',
    office: initial?.office || '',
    phone: initial?.phone || '',
    email: initial?.email || email || '',
    municipalities: initial?.municipalities || [],
    note: initial?.note || '',
    published: initial ? initial.published : true,
  });
  const [consent, setConsent] = useState(!!initial);
  const [saved, setSaved] = useState(!!initial);
  const [msg, setMsg] = useState(null);
  const [q, setQ] = useState('');
  const [links, setLinks] = useState('');
  const [claims, setClaims] = useState(initialClaims || []);
  const [claimMsg, setClaimMsg] = useState(null);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const matches = useMemo(() => {
    const k = norm(q).trim();
    if (k.length < 2) return [];
    return ALL.filter((m) => m.key.includes(k) && !f.municipalities.includes(m.code)).slice(0, 8);
  }, [q, f.municipalities]);

  async function save(e) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch('/api/engineer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, consent }) });
    const j = await res.json().catch(() => ({}));
    if (res.ok) { setSaved(true); setMsg({ ok: true, t: f.published ? 'Αποθηκεύτηκε. Οι συνδρομητές βλέπουν πλέον το τηλέφωνό σου στα έργα σου.' : 'Αποθηκεύτηκε, αλλά είσαι κρυφός: δεν σε βλέπει κανείς.' }); }
    else setMsg({ ok: false, t: j.error || 'Δεν αποθηκεύτηκε.' });
  }

  async function remove() {
    await fetch('/api/engineer', { method: 'DELETE' });
    window.location.reload();
  }

  async function addClaims(e) {
    e.preventDefault();
    setClaimMsg(null);
    const res = await fetch('/api/engineer/claims', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ links }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return setClaimMsg({ ok: false, t: j.error || 'Δεν προστέθηκαν.' });
    setClaims((c) => [...j.added.filter((a) => !c.some((x) => x.ada === a.ada)), ...c]);
    setLinks('');
    setClaimMsg({
      ok: true,
      t: `Προστέθηκαν ${j.added.length} έργα.${j.missing.length ? ` Δεν βρήκαμε ${j.missing.length} (π.χ. παλιά άδεια ή λάθος κωδικός).` : ''}`,
    });
  }

  async function unclaim(ada) {
    await fetch('/api/engineer/claims', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ada }) });
    setClaims((c) => c.filter((x) => x.ada !== ada));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <form className="card" onSubmit={save} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <b className="disp" style={{ fontSize: 20 }}>1. Τα στοιχεία σου</b>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div className="field"><label htmlFor="e-name">Ονοματεπώνυμο</label><input id="e-name" className="input" required value={f.name} onChange={set('name')} autoComplete="name" /></div>
          <div className="field"><label htmlFor="e-spec">Ειδικότητα</label>
            <select id="e-spec" className="input" value={f.specialty} onChange={set('specialty')}>
              {['Πολιτικός μηχανικός', 'Αρχιτέκτονας μηχανικός', 'Μηχανολόγος μηχανικός', 'Ηλεκτρολόγος μηχανικός', 'Τοπογράφος μηχανικός', 'Πολιτικός μηχανικός Τ.Ε.', 'Άλλο'].map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div className="field"><label htmlFor="e-office">Γραφείο / εταιρεία (προαιρετικό)</label><input id="e-office" className="input" value={f.office} onChange={set('office')} /></div>
          <div className="field"><label htmlFor="e-phone">Τηλέφωνο για προμηθευτές</label><input id="e-phone" className="input" type="tel" required value={f.phone} onChange={set('phone')} autoComplete="tel" placeholder="21… ή 69…" /></div>
          <div className="field"><label htmlFor="e-email">Email (προαιρετικό)</label><input id="e-email" className="input" type="email" value={f.email} onChange={set('email')} autoComplete="email" /></div>
        </div>
        <div className="field">
          <label htmlFor="e-muni">Δήμοι όπου δουλεύεις</label>
          <input id="e-muni" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Γράψε δήμο, π.χ. Γλυφάδα" />
          {matches.length > 0 && (
            <div className="chips" style={{ marginTop: 6 }}>
              {matches.map((m) => (
                <button key={m.code} type="button" className="chip" onClick={() => { setF((x) => ({ ...x, municipalities: [...x.municipalities, m.code].slice(0, 30) })); setQ(''); }}>+ {m.name}</button>
              ))}
            </div>
          )}
          {f.municipalities.length > 0 && (
            <div className="chips" style={{ marginTop: 6 }}>
              {f.municipalities.map((c) => (
                <button key={c} type="button" className="chip" aria-pressed="true" onClick={() => setF((x) => ({ ...x, municipalities: x.municipalities.filter((y) => y !== c) }))}>{MUNICIPALITIES[c]} ✕</button>
              ))}
            </div>
          )}
        </div>
        <div className="field"><label htmlFor="e-note">Σημείωμα για τους προμηθευτές (προαιρετικό)</label><input id="e-note" className="input" value={f.note} onChange={set('note')} placeholder="π.χ. Καλέστε 10:00–14:00 ή στείλτε προσφορά με email" /></div>
        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14 }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3 }} />
          <span>Συμφωνώ να εμφανίζονται το όνομα, η ειδικότητα, το γραφείο και το τηλέφωνό μου στους συνδρομητές του Radar, στα έργα που δηλώνω και στους δήμους που διάλεξα, ώστε να μου κάνουν προσφορές. Μπορώ να τα κρύψω ή να τα σβήσω οποτεδήποτε. <Link href="/aporrito" style={{ color: 'var(--accent)' }}>Απόρρητο</Link></span>
        </label>
        <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14 }}>
          <input type="checkbox" checked={f.published} onChange={(e) => setF((x) => ({ ...x, published: e.target.checked }))} />
          <span>Ορατός στους συνδρομητές</span>
        </label>
        {msg && <div className={`notice ${msg.ok ? 'good' : 'bad'}`}>{msg.t}</div>}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn primary" type="submit" disabled={!consent}>Αποθήκευση</button>
          {saved && <button className="btn ghost" type="button" onClick={remove}>Σβήσε τα στοιχεία μου</button>}
        </div>
      </form>

      <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, opacity: saved ? 1 : 0.55 }}>
        <b className="disp" style={{ fontSize: 20 }}>2. Τα έργα σου</b>
        <span className="muted" style={{ fontSize: 14.5 }}>Επικόλλησε το link της Διαύγειας ή τον ΑΔΑ για κάθε άδεια όπου είσαι μελετητής ή επιβλέπων. Μπορείς να βάλεις πολλά μαζί, ένα σε κάθε γραμμή. Σε αυτά τα έργα οι συνδρομητές θα βλέπουν «Ο μηχανικός του έργου» με το τηλέφωνό σου.</span>
        <form onSubmit={addClaims} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <textarea className="input" rows={3} value={links} onChange={(e) => setLinks(e.target.value)} disabled={!saved} placeholder={'https://diavgeia.gov.gr/decision/view/…\nΨΑ1Β46ΜΤΛΡ-7ΘΔ'} />
          <button className="btn" type="submit" disabled={!saved || !links.trim()} style={{ alignSelf: 'flex-start' }}>Πρόσθεσε έργα</button>
        </form>
        {claimMsg && <div className={`notice ${claimMsg.ok ? 'good' : 'bad'}`}>{claimMsg.t}</div>}
        {claims.map((c) => (
          <div key={c.ada} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: 10 }}>
            <span style={{ minWidth: 0 }}><b style={{ fontSize: 14 }}>{c.title || 'Άδεια'}</b> <span className="mono fine">{c.ada}</span></span>
            <button type="button" className="btn small ghost" onClick={() => unclaim(c.ada)}>Αφαίρεση</button>
          </div>
        ))}
      </div>
    </div>
  );
}
