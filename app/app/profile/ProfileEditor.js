'use client';
import { useState } from 'react';
import Link from 'next/link';
import { PRODUCTS, PRODUCT_GROUPS } from '../../../lib/classify';
import { slugify } from '../../../lib/profile';
import s from './editor.module.css';

const when = (d) => new Date(d).toLocaleString('el-GR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// Shrink a photo in the browser before upload (max 1600px, JPEG).
async function shrink(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, bad) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = bad;
      i.src = url;
    });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.82));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function ProfileEditor({ initial, saved, active, site, works: initialWorks, quotes }) {
  const [p, setP] = useState({ ...initial, since_year: initial.since_year || '', tagsText: (initial.tags || []).join(', ') });
  const [exists, setExists] = useState(saved);
  const [state, setState] = useState('idle');
  const [msg, setMsg] = useState('');
  const [works, setWorks] = useState(initialWorks);
  const [copied, setCopied] = useState(false);
  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setP((x) => ({ ...x, [k]: v }));
    setState('idle');
  };
  const toggleTrade = (k) => setP((x) => ({ ...x, trades: x.trades.includes(k) ? x.trades.filter((t) => t !== k) : [...x.trades, k] }));
  const link = `${site}/m/${p.slug}`;

  async function save(e, publish) {
    e?.preventDefault();
    setState('saving');
    const body = { ...p, tags: p.tagsText.split(',').map((t) => t.trim()).filter(Boolean), published: publish ?? p.published };
    const res = await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setState('error');
      setMsg(json.error || 'Δεν αποθηκεύτηκε.');
      return;
    }
    setP((x) => ({ ...x, slug: json.profile.slug, published: json.profile.published }));
    setExists(true);
    setState('saved');
    setMsg(json.profile.published ? 'Αποθηκεύτηκε. Η σελίδα σου είναι δημόσια.' : 'Αποθηκεύτηκε. Η σελίδα δεν είναι ακόμα δημόσια.');
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <main className={s.page}>
      <div className={s.head}>
        <div>
          <span className="eyebrow">Το προφίλ μου</span>
          <h1 className={s.h1}>Η σελίδα που στέλνεις στους μηχανικούς.</h1>
          <p className="muted" style={{ margin: '6px 0 0', maxWidth: '64ch' }}>
            Βάλε τις δουλειές σου, τις περιοχές σου και ένα τηλέφωνο. Όταν βρεις νέα οικοδομή στο Radar, στέλνεις αυτό το link στον μηχανικό ή στον εργολάβο.
          </p>
        </div>
        {exists && p.published && (
          <div className={`card ${s.linkBox}`}>
            <span className="label">Η σελίδα σου</span>
            <a className="mono" href={`/m/${p.slug}`} target="_blank" rel="noopener noreferrer">{link.replace(/^https?:\/\//, '')}</a>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" className="btn small primary" onClick={copy}>{copied ? '✓ Αντιγράφηκε' : 'Αντιγραφή link'}</button>
              <a className="btn small" href={`/m/${p.slug}`} target="_blank" rel="noopener noreferrer">Άνοιγμα ↗</a>
            </div>
          </div>
        )}
      </div>

      {!active && <div className="notice">Η σελίδα σου φαίνεται δημόσια μόνο όσο έχεις ενεργή συνδρομή. <Link href="/app/plan">Διάλεξε πακέτο</Link></div>}

      <div className={s.cols}>
        <form onSubmit={(e) => save(e)} className={`card ${s.form}`}>
          <h2 className={s.h2}>Στοιχεία</h2>
          <div className={s.two}>
            <div className="field"><label htmlFor="pf-name">Όνομα επιχείρησης</label><input id="pf-name" className="input" required value={p.name} onChange={(e) => { const v = e.target.value; setP((x) => ({ ...x, name: v, slug: !exists && (!x.slug || x.slug === slugify(x.name)) ? slugify(v) : x.slug })); }} placeholder="π.χ. Αλουμίνια Παπαδόπουλος" /></div>
            <div className="field"><label htmlFor="pf-slug">Διεύθυνση σελίδας</label><input id="pf-slug" className="input mono" value={p.slug} onChange={set('slug')} onBlur={() => setP((x) => ({ ...x, slug: slugify(x.slug) }))} placeholder="alouminia-papadopoulos" /><span className="fine">{site.replace(/^https?:\/\//, '')}/m/{p.slug || '…'}</span></div>
          </div>
          <div className="field"><label htmlFor="pf-head">Τι κάνεις, σε μία γραμμή</label><input id="pf-head" className="input" value={p.headline} onChange={set('headline')} placeholder="π.χ. Κουφώματα αλουμινίου, θερμοπρόσοψη, κάγκελα" /></div>
          <div className="field"><label htmlFor="pf-about">Λίγα λόγια</label><textarea id="pf-about" className="input" rows={5} value={p.about} onChange={set('about')} placeholder="π.χ. Οικογενειακή επιχείρηση από το 2004. Δικό μας συνεργείο. Τηρούμε το χρονοδιάγραμμα του εργοταξίου." /></div>
          <div className={s.two}>
            <div className="field"><label htmlFor="pf-areas">Περιοχές που εξυπηρετείς</label><input id="pf-areas" className="input" value={p.areas} onChange={set('areas')} placeholder="π.χ. Νότια Προάστια, Ανατολική Αττική" /></div>
            <div className="field"><label htmlFor="pf-year">Από ποια χρονιά δουλεύεις</label><input id="pf-year" className="input" inputMode="numeric" value={p.since_year} onChange={(e) => setP((x) => ({ ...x, since_year: e.target.value.replace(/\D/g, '').slice(0, 4) }))} placeholder="π.χ. 2004" /></div>
          </div>
          <div className={s.two}>
            <div className="field"><label htmlFor="pf-phone">Τηλέφωνο (και Viber)</label><input id="pf-phone" className="input" type="tel" value={p.phone} onChange={set('phone')} placeholder="69…" /></div>
            <div className="field"><label htmlFor="pf-email">Email για πελάτες</label><input id="pf-email" className="input" type="email" value={p.public_email} onChange={set('public_email')} /></div>
          </div>
          <div className={s.two}>
            <div className="field"><label htmlFor="pf-web">Ιστοσελίδα (προαιρετικό)</label><input id="pf-web" className="input" value={p.website} onChange={set('website')} placeholder="https://…" /></div>
            <div className="field"><label htmlFor="pf-addr">Έκθεση / έδρα (προαιρετικό)</label><input id="pf-addr" className="input" value={p.address} onChange={set('address')} placeholder="π.χ. Λ. Βουλιαγμένης, Γλυφάδα" /></div>
          </div>
          <div className="field">
            <label>Τι κάνεις (έως 12)</label>
            {PRODUCT_GROUPS.map(([g, label, keys]) => (
              <div key={g} className={s.group}>
                <span className="fine">{label}</span>
                <div className="chips">
                  {keys.map((k) => <button key={k} type="button" className="chip" aria-pressed={p.trades.includes(k)} onClick={() => toggleTrade(k)}>{PRODUCTS[k].phase}</button>)}
                </div>
              </div>
            ))}
          </div>
          <div className="field"><label htmlFor="pf-tags">Ειδικότητες, χωρισμένες με κόμμα</label><input id="pf-tags" className="input" value={p.tagsText} onChange={set('tagsText')} placeholder="π.χ. Θερμοδιακοπή, Συρόμενα, Σήτες" /></div>

          {msg && <div className={`notice ${state === 'error' ? 'bad' : 'good'}`}>{msg}</div>}
          <div className={s.actions}>
            <button className="btn" type="submit" disabled={state === 'saving'}>Αποθήκευση</button>
            {p.published ? (
              <button className="btn" type="button" disabled={state === 'saving'} onClick={(e) => save(e, false)}>Απόκρυψη σελίδας</button>
            ) : (
              <button className="btn primary" type="button" disabled={state === 'saving'} onClick={(e) => save(e, true)}>Αποθήκευση και δημοσίευση</button>
            )}
          </div>
        </form>

        <div className={s.side}>
          <WorksEditor works={works} setWorks={setWorks} enabled={exists} />
          <section className={`card ${s.box}`}>
            <h2 className={s.h2}>Αιτήματα προσφοράς {quotes.length > 0 && <span className="mono fine">({quotes.length})</span>}</h2>
            {!quotes.length && <span className="muted">Όταν κάποιος πατήσει «Ζήτα προσφορά» στη σελίδα σου, θα το δεις εδώ και θα σου έρθει email.</span>}
            {quotes.map((q) => (
              <div key={q.id} className={s.quote}>
                <div className={s.quoteTop}><b>{q.name}</b><span className="mono fine">{when(q.created_at)}</span></div>
                <span className="fine">{[q.project, q.area].filter(Boolean).join(' · ')}</span>
                {q.message && <span className={s.quoteMsg}>{q.message}</span>}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {q.phone && <a className="btn small primary" href={`tel:${q.phone.replace(/\s/g, '')}`}>📞 {q.phone}</a>}
                  {q.email && <a className="btn small" href={`mailto:${q.email}`}>{q.email}</a>}
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}

function WorksEditor({ works, setWorks, enabled }) {
  const blank = { title: '', place: '', year: '', category: '', via_radar: false, photo_path: null, photo: null };
  const [w, setW] = useState(blank);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const set = (k) => (e) => setW((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function upload(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setBusy('photo');
    setErr('');
    try {
      const blob = await shrink(file);
      const fd = new FormData();
      fd.append('file', blob, 'photo.jpg');
      const res = await fetch('/api/profile/photo', { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Δεν ανέβηκε η φωτογραφία.');
      setW((x) => ({ ...x, photo_path: json.path, photo: json.url }));
    } catch (ex) {
      setErr(ex.message || 'Δεν ανέβηκε η φωτογραφία. Δοκίμασε άλλη.');
    }
    setBusy('');
  }

  async function add(e) {
    e.preventDefault();
    setBusy('save');
    setErr('');
    const res = await fetch('/api/profile/works', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...w, year: w.year ? Number(w.year) : null }) });
    const json = await res.json().catch(() => ({}));
    setBusy('');
    if (!res.ok) return setErr(json.error || 'Δεν αποθηκεύτηκε.');
    setWorks((xs) => [...xs, json.work]);
    setW(blank);
  }

  async function remove(id) {
    setWorks((xs) => xs.filter((x) => x.id !== id));
    await fetch('/api/profile/works', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
  }

  return (
    <section className={`card ${s.box}`}>
      <h2 className={s.h2}>Δουλειές σου</h2>
      {!enabled && <span className="muted">Αποθήκευσε πρώτα τα στοιχεία σου και μετά πρόσθεσε δουλειές.</span>}
      {works.length > 0 && (
        <div className={s.thumbs}>
          {works.map((x) => (
            <div key={x.id} className={s.thumb}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {x.photo ? <img src={x.photo} alt="" /> : <span className={s.noPhoto} />}
              <div><b>{x.title}</b><span className="fine">{[x.place, x.year].filter(Boolean).join(' · ')}</span></div>
              <button type="button" className="btn small" onClick={() => remove(x.id)} aria-label={`Αφαίρεση: ${x.title}`}>✕</button>
            </div>
          ))}
        </div>
      )}
      {enabled && (
        <form onSubmit={add} className={s.addWork}>
          <span className="label">Νέα δουλειά</span>
          <label className={s.drop}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {w.photo ? <img src={w.photo} alt="" /> : <span>{busy === 'photo' ? 'Ανεβαίνει…' : '+ Φωτογραφία'}</span>}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} disabled={busy === 'photo'} />
          </label>
          <input className="input" required value={w.title} onChange={set('title')} placeholder="Τίτλος, π.χ. Πολυκατοικία 8 διαμερισμάτων" aria-label="Τίτλος" />
          <div className={s.two}>
            <input className="input" value={w.place} onChange={set('place')} placeholder="Περιοχή" aria-label="Περιοχή" />
            <input className="input" inputMode="numeric" value={w.year} onChange={(e) => setW((x) => ({ ...x, year: e.target.value.replace(/\D/g, '').slice(0, 4) }))} placeholder="Χρονιά" aria-label="Χρονιά" />
          </div>
          <select className="input" value={w.category} onChange={set('category')} aria-label="Κατηγορία">
            <option value="">Κατηγορία (προαιρετικό)</option>
            {PRODUCT_GROUPS.map(([g, label, keys]) => (
              <optgroup key={g} label={label}>{keys.map((k) => <option key={k} value={k}>{PRODUCTS[k].phase}</option>)}</optgroup>
            ))}
          </select>
          <label className={s.check}><input type="checkbox" checked={w.via_radar} onChange={set('via_radar')} /> Το βρήκα μέσω Radar</label>
          {err && <div className="notice bad">{err}</div>}
          <button className="btn primary" type="submit" disabled={!!busy}>{busy === 'save' ? 'Αποθήκευση…' : 'Προσθήκη δουλειάς'}</button>
        </form>
      )}
    </section>
  );
}
