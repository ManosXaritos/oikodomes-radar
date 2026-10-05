'use client';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { TYPES, PRODUCTS, PHASES, fits, needWindow, stageOffsetMonths } from '../../lib/classify';
import { municipalityName } from '../../lib/geo';
import s from './dashboard.module.css';

const MapView = dynamic(() => import('./MapView'), { ssr: false, loading: () => <div className={s.mapLoading}>Φορτώνει ο χάρτης…</div> });

const LEAD_STATUS = { new: 'Νέο', contacted: 'Μίλησα', offer: 'Έστειλα προσφορά', won: 'Κερδίθηκε', lost: 'Χάθηκε' };
const dayShort = (d) => new Date(d).toLocaleDateString('el-GR', { day: 'numeric', month: 'short' });
const dayLong = (d) => new Date(d).toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const monthYear = (d) => d.toLocaleDateString('el-GR', { month: 'long', year: 'numeric' });

export default function Dashboard({ plan, products, status, trialEnd, focus }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState({ permits: [], leads: {}, places: {} });
  const [load, setLoad] = useState('loading'); // loading | ready | error
  const [product, setProduct] = useState(products.length === 1 ? products[0] : 'all');
  const [types, setTypes] = useState(new Set());
  const [stages, setStages] = useState(new Set());
  const [view, setView] = useState('all'); // all | following
  const [sel, setSel] = useState(focus);

  useEffect(() => {
    let live = true;
    setLoad('loading');
    fetch(`/api/permits?days=${days}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((json) => {
        if (!live) return;
        setData({ permits: json.permits, places: json.places, leads: Object.fromEntries(json.leads.map((l) => [l.ada, l])) });
        setLoad('ready');
      })
      .catch(() => live && setLoad('error'));
    return () => {
      live = false;
    };
  }, [days]);

  const productChoices = products.length ? products : Object.keys(PRODUCTS);

  const visible = useMemo(() => {
    let list = data.permits;
    if (view === 'following') list = list.filter((p) => data.leads[p.ada]);
    if (types.size) list = list.filter((p) => types.has(p.type));
    if (stages.size) list = list.filter((p) => stages.has(p.stage));
    if (product !== 'all') list = [...list].sort((a, b) => fits(b, product) - fits(a, product) || new Date(b.published_at) - new Date(a.published_at));
    return list;
  }, [data, view, types, stages, product]);

  useEffect(() => {
    if (load !== 'ready') return;
    if (!sel || !visible.some((p) => p.ada === sel)) {
      const first = product === 'all' ? visible[0] : visible.find((p) => fits(p, product)) || visible[0];
      setSel(first ? first.ada : null);
    }
  }, [visible, load, sel, product]);

  const matches = product === 'all' ? null : visible.filter((p) => fits(p, product)).length;
  const big = visible.filter((p) => ['multi', 'tour', 'biz'].includes(p.type)).length;
  const pre = visible.filter((p) => p.stage === 'pre').length;
  const following = Object.keys(data.leads).length;

  const points = visible
    .filter((p) => data.places[p.municipality_code])
    .map((p) => ({
      ada: p.ada,
      code: p.municipality_code,
      lat: data.places[p.municipality_code][0],
      lon: data.places[p.municipality_code][1],
      stage: p.stage,
      title: p.title,
      place: municipalityName(p.municipality_code),
      dim: product !== 'all' && !fits(p, product),
      hl: product !== 'all' && fits(p, product),
    }));
  const unmapped = visible.length - points.length;

  const toggle = (set, setter, k) => {
    const n = new Set(set);
    n.has(k) ? n.delete(k) : n.add(k);
    setter(n);
  };

  async function saveLead(ada, patch) {
    const cur = data.leads[ada] || { ada, status: 'new', note: '', remind_on: null };
    const next = { ...cur, ...patch };
    setData((d) => ({ ...d, leads: { ...d.leads, [ada]: next } }));
    const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) });
    return res.ok;
  }
  async function unfollow(ada) {
    setData((d) => {
      const leads = { ...d.leads };
      delete leads[ada];
      return { ...d, leads };
    });
    await fetch('/api/leads', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ada }) });
  }

  const current = data.permits.find((p) => p.ada === sel);

  return (
    <main className={s.page}>
      {status === 'trialing' && trialEnd && (
        <div className="notice" style={{ marginBottom: 12 }}>
          Δωρεάν δοκιμή έως {dayLong(trialEnd)}. Πακέτο {plan}. <Link href="/app/settings">Ρυθμίσεις</Link>
        </div>
      )}
      {status === 'past_due' && (
        <div className="notice bad" style={{ marginBottom: 12 }}>
          Η τελευταία πληρωμή απέτυχε. <Link href="/app/settings">Άλλαξε κάρτα</Link> για να μη χάσεις την πρόσβαση.
        </div>
      )}

      <section className={s.kpis} aria-label="Σύνοψη">
        <Kpi k="Νέες άδειες" v={visible.length} sub={`τις τελευταίες ${days} μέρες`} />
        {matches === null ? <Kpi k="Μεγάλα έργα" v={big} sub="πολυκατοικίες, τουριστικά, επαγγελματικά" /> : <Kpi k="Ταιριάζουν σε σένα" v={matches} sub={PRODUCTS[product].label} />}
        <Kpi k="Προεγκρίσεις" v={pre} sub="ξεκινούν σε λίγους μήνες" />
        <Kpi k="Παρακολουθείς" v={following} sub="έργα στη λίστα σου" />
      </section>

      <section className={s.main}>
        <aside className={`card ${s.side}`} aria-label="Λίστα αδειών">
          <div className={s.filters}>
            <div className="field">
              <label htmlFor="product">Τι πουλάς;</label>
              <select id="product" className="input" value={product} onChange={(e) => setProduct(e.target.value)}>
                {productChoices.length > 1 && <option value="all">Όλα τα έργα</option>}
                {productChoices.map((k) => <option key={k} value={k}>{PRODUCTS[k].label}</option>)}
              </select>
            </div>
            <div className={s.row2}>
              <div className="field">
                <label htmlFor="days">Περίοδος</label>
                <select id="days" className="input" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                  <option value={7}>7 μέρες</option>
                  <option value={30}>30 μέρες</option>
                  <option value={90}>3 μήνες</option>
                  <option value={365}>1 χρόνος</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="view">Εμφάνιση</label>
                <select id="view" className="input" value={view} onChange={(e) => setView(e.target.value)}>
                  <option value="all">Όλες οι άδειες</option>
                  <option value="following">Μόνο όσες παρακολουθώ</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>Τύπος έργου</label>
              <div className="chips">
                {Object.entries(TYPES).map(([k, t]) => (
                  <button key={k} type="button" className="chip" aria-pressed={types.has(k)} onClick={() => toggle(types, setTypes, k)}>{t.short}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Στάδιο</label>
              <div className="chips">
                <button type="button" className="chip" aria-pressed={stages.has('ok')} onClick={() => toggle(stages, setStages, 'ok')}>Άδεια εκδόθηκε</button>
                <button type="button" className="chip" aria-pressed={stages.has('pre')} onClick={() => toggle(stages, setStages, 'pre')}>Προέγκριση</button>
              </div>
            </div>
          </div>
          <div className={s.list}>
            {load === 'loading' && <div className={s.empty}>Φορτώνουν οι άδειες…</div>}
            {load === 'error' && <div className={s.empty}>Δεν φορτώθηκαν οι άδειες. Ανανέωσε τη σελίδα σε λίγο.</div>}
            {load === 'ready' && !visible.length && (
              <div className={s.empty}>
                {view === 'following' ? 'Δεν παρακολουθείς ακόμα κανένα έργο. Άνοιξε μια άδεια και πάτα «Παρακολούθηση».' : 'Καμία άδεια με αυτά τα φίλτρα. Μεγάλωσε την περίοδο ή αφαίρεσε ένα φίλτρο.'}
              </div>
            )}
            {load === 'ready' &&
              visible.map((p) => {
                const lead = data.leads[p.ada];
                return (
                  <button key={p.ada} type="button" className={`${s.row}${product !== 'all' && !fits(p, product) ? ` ${s.dim}` : ''}`} aria-current={sel === p.ada} onClick={() => setSel(p.ada)}>
                    <span className={`${s.bar} ${p.stage === 'pre' ? s.pre : s.ok}`} />
                    <span style={{ minWidth: 0 }}>
                      <span className={s.rt}>{p.title}</span>
                      <span className={s.rs}>
                        {municipalityName(p.municipality_code)} · {TYPES[p.type]?.short}{p.pool ? ' · πισίνα' : ''}
                        {lead ? ` · ${LEAD_STATUS[lead.status]}` : ''}
                      </span>
                    </span>
                    <span className={s.rd}><b>{dayShort(p.published_at)}</b>{p.stage === 'pre' ? 'προέγκρ.' : 'άδεια'}</span>
                  </button>
                );
              })}
          </div>
        </aside>

        <div className={`card ${s.mapbox}`}>
          <div className={s.maphead}>
            <b className="disp">Χάρτης αδειών</b>
            <div className={s.legend}>
              <span><i className={s.ok} />Οικοδομική άδεια</span>
              <span><i className={s.pre} />Προέγκριση</span>
            </div>
          </div>
          <div className={s.mapArea}>
            <MapView points={points} selected={sel} onSelect={setSel} />
          </div>
          {unmapped > 0 && load === 'ready' && <p className={s.mapnote}>{unmapped} άδειες δεν φαίνονται ακόμα στον χάρτη γιατί ο δήμος τους εντοπίζεται αύριο. Είναι όλες στη λίστα.</p>}
        </div>

        <div className={`card ${s.dossierCol}`}>
          {current ? (
            <Dossier key={current.ada} p={current} product={product} lead={data.leads[current.ada]} onSave={saveLead} onUnfollow={unfollow} />
          ) : (
            <div className={s.empty}>Διάλεξε μια άδεια από τη λίστα ή τον χάρτη.</div>
          )}
        </div>
      </section>
    </main>
  );
}

function Kpi({ k, v, sub }) {
  return (
    <div className={`card ${s.kpi}`}>
      <div className={s.kk}>{k}</div>
      <div className={`disp ${s.kv}`}>{v}</div>
      <div className={s.ks}>{sub}</div>
    </div>
  );
}

function Dossier({ p, product, lead, onSave, onUnfollow }) {
  const [note, setNote] = useState(lead?.note || '');
  const [remind, setRemind] = useState(lead?.remind_on || '');
  const [saved, setSaved] = useState('');
  const off = stageOffsetMonths(p.stage);
  const maxM = 18;
  const phases = PHASES.filter(([, , , k]) => !k || fits(p, k));
  let next = null;
  if (product !== 'all') {
    if (fits(p, product)) {
      const w = needWindow(p, product);
      next = (
        <div className="notice">
          Για <b>{PRODUCTS[product].label.toLowerCase()}</b>, το έργο θα σε χρειαστεί περίπου <b>{monthYear(w.from)} – {monthYear(w.to)}</b>. Μίλα με τον μηχανικό νωρίς, για να μπεις στη λίστα του.
        </div>
      );
    } else next = <div className="notice">Αυτό το έργο μάλλον δεν ταιριάζει για {PRODUCTS[product].label.toLowerCase()}.</div>;
  }

  async function saveNote() {
    const ok = await onSave(p.ada, { note, remind_on: remind || null });
    setSaved(ok ? 'Αποθηκεύτηκε.' : 'Δεν αποθηκεύτηκε. Δοκίμασε ξανά.');
  }

  return (
    <div className={s.dossier}>
      <div className={s.stamp}>
        <span className={`pill ${p.stage}`}>{p.stage === 'ok' ? 'ΟΙΚΟΔΟΜΙΚΗ ΑΔΕΙΑ' : 'ΠΡΟΕΓΚΡΙΣΗ'}</span>
        <span className="num fine">ΑΔΑ {p.ada}</span>
      </div>
      <div>
        <h2 className={`disp ${s.h2}`}>{p.title}</h2>
        <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>{municipalityName(p.municipality_code)} · {dayLong(p.issued_at)}</div>
      </div>
      <div className={s.facts}>
        <Fact k="Τύπος έργου" v={TYPES[p.type]?.label} />
        <Fact k="Μέγεθος ευκαιρίας" v={TYPES[p.type]?.size} />
        <Fact k="Πισίνα" v={p.pool ? 'Ναι' : 'Όχι'} />
        <Fact k="Στάδιο" v={p.stage === 'ok' ? 'Ξεκινά τώρα' : 'Σε ~3 μήνες'} />
      </div>
      {next}

      <div className={s.sect}>Τι θα χρειαστεί και πότε</div>
      <div className={s.tl}>
        {phases.map(([name, a, b, k]) => (
          <div key={name} className={`${s.tlRow}${k === product ? ` ${s.mine}` : ''}`}>
            <span>{name}</span>
            <div className={s.track}><div className={s.tlBar} style={{ left: `${((a + off) / maxM) * 100}%`, width: `${((b - a) / maxM) * 100}%` }} /></div>
          </div>
        ))}
        <div className={s.axis}><span /><div><span>τώρα</span><span>6 μήνες</span><span>12</span><span>18</span></div></div>
      </div>
      <p className="fine" style={{ margin: 0 }}>Τυπικοί χρόνοι για ελληνική οικοδομή, ενδεικτικά.</p>

      <div className={s.actions}>
        <a className="btn primary" href={p.document_url} target="_blank" rel="noopener noreferrer">Άνοιξε την άδεια στη Διαύγεια ↗</a>
        {lead ? (
          <button type="button" className="btn" onClick={() => onUnfollow(p.ada)}>Σταμάτα την παρακολούθηση</button>
        ) : (
          <button type="button" className="btn" onClick={() => onSave(p.ada, { status: 'new' })}>Παρακολούθηση</button>
        )}
      </div>
      <p className="fine" style={{ margin: 0 }}>
        Στο έγγραφο της άδειας θα βρεις τη διεύθυνση του έργου και τον μηχανικό. Μίλα με τον μηχανικό ή επισκέψου το εργοτάξιο. Μην καλείς ιδιοκτήτες ιδιώτες.
      </p>

      {lead && (
        <div className={s.lead}>
          <div className={s.sect}>Η πορεία σου</div>
          <div className="chips">
            {Object.entries(LEAD_STATUS).map(([k, label]) => (
              <button key={k} type="button" className="chip" aria-pressed={lead.status === k} onClick={() => onSave(p.ada, { status: k })}>{label}</button>
            ))}
          </div>
          <div className="field">
            <label htmlFor="note">Σημειώσεις</label>
            <textarea id="note" className="input" rows={3} value={note} onChange={(e) => { setNote(e.target.value); setSaved(''); }} placeholder="π.χ. Μηχανικός: κ. Χ, τηλ. γραφείου… Ξαναπάρε τον Μάρτιο." />
          </div>
          <div className="field">
            <label htmlFor="remind">Υπενθύμιση</label>
            <input id="remind" className="input" type="date" value={remind || ''} onChange={(e) => { setRemind(e.target.value); setSaved(''); }} />
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button type="button" className="btn" onClick={saveNote}>Αποθήκευση σημειώσεων</button>
            {saved && <span className="fine">{saved}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function Fact({ k, v }) {
  return (
    <div className={s.fact}>
      <div className={s.fk}>{k}</div>
      <div className={s.fv}>{v}</div>
    </div>
  );
}
