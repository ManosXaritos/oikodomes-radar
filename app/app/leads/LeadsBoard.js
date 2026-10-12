'use client';
import { useState } from 'react';
import Link from 'next/link';
import s from './leads.module.css';

const COLS = [
  ['new', 'Νέα', 'var(--accent)'],
  ['contacted', 'Μίλησα', 'var(--accent2)'],
  ['offer', 'Προσφορά', 'var(--warn)'],
  ['won', 'Κερδήθηκε', 'var(--accent)'],
];
const NEXT = { new: 'contacted', contacted: 'offer', offer: 'won' };
const LABEL = { new: 'Νέα', contacted: 'Μίλησα', offer: 'Προσφορά', won: 'Κερδήθηκε', lost: 'Χάθηκε' };
const eur = (n) => '€' + Number(n || 0).toLocaleString('el-GR');
const short = (d) => new Date(d).toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' });
const today = () => new Date().toISOString().slice(0, 10);

export default function LeadsBoard({ initial }) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(null);
  const [err, setErr] = useState('');

  async function save(ada, patch) {
    const cur = items.find((i) => i.ada === ada);
    const next = { ...cur, ...patch };
    setItems((xs) => xs.map((x) => (x.ada === ada ? next : x)));
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ada, status: next.status, note: next.note, remind_on: next.remind_on, amount: next.amount }),
    });
    setErr(res.ok ? '' : 'Μια αλλαγή δεν αποθηκεύτηκε. Ανανέωσε τη σελίδα και δοκίμασε ξανά.');
  }
  async function remove(ada) {
    setItems((xs) => xs.filter((x) => x.ada !== ada));
    await fetch('/api/leads', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ada }) });
  }

  const active = items.filter((i) => !['won', 'lost'].includes(i.status));
  const offers = items.filter((i) => i.status === 'offer').reduce((a, b) => a + (b.amount || 0), 0);
  const won = items.filter((i) => i.status === 'won').reduce((a, b) => a + (b.amount || 0), 0);
  const due = items.filter((i) => i.remind_on && i.remind_on <= today() && !['won', 'lost'].includes(i.status));
  const lost = items.filter((i) => i.status === 'lost');

  return (
    <main className={s.page}>
      <div className={s.head}>
        <div>
          <span className="eyebrow">Τα έργα μου</span>
          <h1 className={s.h1}>Από την άδεια στην υπογραφή.</h1>
        </div>
        <div className={s.stats}>
          <div className="card"><span>Ενεργά έργα</span><b>{active.length}</b></div>
          <div className="card"><span>Ανοιχτές προσφορές</span><b>{eur(offers)}</b></div>
          <div className={`card ${s.wonStat}`}><span>Κερδισμένα</span><b>{eur(won)}</b></div>
        </div>
      </div>

      {err && <div className="notice bad">{err}</div>}

      {due.length > 0 && (
        <div className={`card ${s.today}`}>
          <span className={`mono ${s.todayTag}`}>ΣΗΜΕΡΑ</span>
          <div className={s.todayList}>
            {due.map((d) => (
              <button key={d.ada} type="button" onClick={() => setOpen(d.ada)}>
                {d.note ? d.note.split('\n')[0].slice(0, 90) : 'Υπενθύμιση'} · <b>{d.title}</b> ({d.place})
              </button>
            ))}
          </div>
        </div>
      )}

      {!items.length ? (
        <div className={`card ${s.empty}`}>
          <b>Δεν παρακολουθείς ακόμα κανένα έργο.</b>
          <span className="muted">Άνοιξε μια άδεια στον χάρτη και πάτα «+ Στα έργα μου». Θα εμφανιστεί εδώ, στη στήλη «Νέα».</span>
          <Link className="btn primary" href="/app">Πήγαινε στον χάρτη</Link>
        </div>
      ) : (
        <div className={s.board}>
          {COLS.map(([key, name, color]) => {
            const list = items.filter((i) => i.status === key);
            return (
              <section key={key} className={s.col} aria-label={name}>
                <div className={s.colHead} style={{ borderBottomColor: color }}>
                  <b>{name}</b>
                  <span className="mono fine">{list.length}</span>
                </div>
                {list.map((it) => (
                  <Card key={it.ada} it={it} open={open === it.ada} onOpen={() => setOpen(open === it.ada ? null : it.ada)} onSave={save} onRemove={remove} />
                ))}
                {!list.length && <span className={s.colEmpty}>—</span>}
              </section>
            );
          })}
        </div>
      )}

      {lost.length > 0 && (
        <details className={`card ${s.lost}`}>
          <summary>Χαμένα ({lost.length})</summary>
          <div className={s.lostList}>
            {lost.map((it) => (
              <div key={it.ada} className={s.lostRow}>
                <span>{it.title} · <span className="muted">{it.place}</span></span>
                <button type="button" className="btn small" onClick={() => save(it.ada, { status: 'new' })}>Επαναφορά</button>
              </div>
            ))}
          </div>
        </details>
      )}
    </main>
  );
}

function Card({ it, open, onOpen, onSave, onRemove }) {
  const [note, setNote] = useState(it.note || '');
  const [remind, setRemind] = useState(it.remind_on || '');
  const [amount, setAmount] = useState(it.amount ? String(it.amount) : '');
  const nxt = NEXT[it.status];
  return (
    <div className={`${s.card}${open ? ` ${s.cardOpen}` : ''}`}>
      <button type="button" className={s.cardTop} onClick={onOpen} aria-expanded={open}>
        <b>{it.title}</b>
        <span className="mono fine">{short(it.published_at)}</span>
      </button>
      <span className={s.place}>{it.place}{it.type ? ` · ${it.type}` : ''}{it.stage === 'pre' ? ' · προέγκριση' : ''}</span>
      {it.note && !open && <span className={s.note}>{it.note}</span>}
      <div className={s.cardFoot}>
        <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: it.status === 'won' ? 'var(--accent)' : '#B6C1BB' }}>{it.amount ? eur(it.amount) : '—'}</span>
        {nxt && <button type="button" className="btn small ghost" onClick={() => onSave(it.ada, { status: nxt })}>{LABEL[nxt]} →</button>}
      </div>
      {open && (
        <div className={s.edit}>
          <div className="field">
            <label htmlFor={`n-${it.ada}`}>Σημειώσεις</label>
            <textarea id={`n-${it.ada}`} className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="π.χ. Μηχανικός κ. Χ. Ξαναπάρε τον Μάρτιο." />
          </div>
          <div className={s.two}>
            <div className="field">
              <label htmlFor={`a-${it.ada}`}>Αξία (€)</label>
              <input id={`a-${it.ada}`} className="input" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))} placeholder="π.χ. 18000" />
            </div>
            <div className="field">
              <label htmlFor={`r-${it.ada}`}>Υπενθύμιση</label>
              <input id={`r-${it.ada}`} className="input" type="date" value={remind} onChange={(e) => setRemind(e.target.value)} />
            </div>
          </div>
          <div className={s.actions}>
            <button type="button" className="btn primary small" onClick={() => onSave(it.ada, { note, remind_on: remind || null, amount: amount ? Number(amount) : null })}>Αποθήκευση</button>
            <Link className="btn small" href={`/app?p=${encodeURIComponent(it.ada)}`}>Στον χάρτη</Link>
            {it.status !== 'lost' && <button type="button" className="btn small" onClick={() => onSave(it.ada, { status: 'lost' })}>Χάθηκε</button>}
            <button type="button" className="btn small" onClick={() => onRemove(it.ada)}>Αφαίρεση</button>
          </div>
        </div>
      )}
    </div>
  );
}
