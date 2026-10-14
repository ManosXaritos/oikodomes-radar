'use client';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { TYPES, PRODUCTS, PRODUCT_GROUPS, phasesFor, fits, needWindow, stageOffsetMonths, scaledWin } from '../../lib/classify';
import { municipalityName } from '../../lib/geo';
import s from './dashboard.module.css';
import useToast from '../components/useToast';

const MapView = dynamic(() => import('./MapView'), { ssr: false, loading: () => <div className={s.mapLoading}>Φορτώνει ο χάρτης…</div> });

const LEAD_STATUS = { new: 'Νέο', contacted: 'Μίλησα', offer: 'Προσφορά', won: 'Κερδήθηκε', lost: 'Χάθηκε' };
const dayShort = (d) => new Date(d).toLocaleDateString('el-GR', { day: 'numeric', month: 'short' });
const dayLong = (d) => new Date(d).toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const monthYear = (d) => d.toLocaleDateString('el-GR', { month: 'long', year: 'numeric' });

export default function Dashboard({ plan, products, status, trialEnd, focus, card }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState({ permits: [], leads: {}, places: {} });
  const [load, setLoad] = useState('loading'); // loading | ready | error
  const [product, setProduct] = useState(products.length === 1 ? products[0] : 'all');
  const [types, setTypes] = useState(new Set());
  const [stages, setStages] = useState(new Set());
  const [view, setView] = useState('all'); // all | following
  const [sel, setSelRaw] = useState(focus);
  const [q, setQ] = useState('');
  const [toast, showToast] = useToast();
  const [hideGuide, setHideGuide] = useState(true);
  useEffect(() => {
    try { setHideGuide(localStorage.getItem('radar-guide-done') === '1'); } catch { setHideGuide(false); }
  }, []);
  const closeGuide = () => {
    setHideGuide(true);
    try { localStorage.setItem('radar-guide-done', '1'); } catch {}
  };
  // On phones the details panel sits below the map, so bring it into view after a tap.
  const setSel = (ada) => {
    setSelRaw(ada);
    if (typeof window !== 'undefined' && window.innerWidth < 1200) {
      setTimeout(() => document.getElementById('dossier')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
  };

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
    const query = q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (query) {
      const n = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      list = list.filter((p) => n(p.title).includes(query) || n(municipalityName(p.municipality_code)).includes(query));
    }
    if (types.size) list = list.filter((p) => types.has(p.type));
    if (stages.size) list = list.filter((p) => stages.has(p.stage));
    if (product !== 'all') list = [...list].sort((a, b) => fits(b, product) - fits(a, product) || new Date(b.published_at) - new Date(a.published_at));
    return list;
  }, [data, view, types, stages, product, q]);

  useEffect(() => {
    if (load !== 'ready') return;
    if (!sel || !visible.some((p) => p.ada === sel)) {
      const first = product === 'all' ? visible[0] : visible.find((p) => fits(p, product)) || visible[0];
      setSelRaw(first ? first.ada : null);
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
    if (!res.ok) showToast('Δεν αποθηκεύτηκε. Δοκίμασε ξανά.', true);
    else if (!data.leads[ada]) showToast('Προστέθηκε στα έργα μου');
    return res.ok;
  }
  async function unfollow(ada) {
    setData((d) => {
      const leads = { ...d.leads };
      delete leads[ada];
      return { ...d, leads };
    });
    await fetch('/api/leads', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ada }) });
    showToast('Αφαιρέθηκε από τα έργα μου');
  }

  const current = data.permits.find((p) => p.ada === sel);

  return (
    <main className={s.page}>
      {toast}
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

      {load === 'ready' && !hideGuide && Object.keys(data.leads).length === 0 && (
        <section className={`card ${s.guide}`} aria-label="Πρώτα βήματα">
          <div className={s.guideHead}>
            <b>Ξεκίνα σε 3 βήματα</b>
            <button type="button" className="navlink" onClick={closeGuide}>Κλείσιμο</button>
          </div>
          <ol>
            <li><b>Διάλεξε τι πουλάς</b><span>Στο «Τι πουλάς;» αριστερά. Τα έργα που σου ταιριάζουν ανεβαίνουν πρώτα.</span></li>
            <li><b>Άνοιξε μια άδεια</b><span>Βλέπεις πότε θα σε χρειαστεί το έργο και το επίσημο έγγραφο με τον μηχανικό.</span></li>
            <li><b>Πάτα «+ Στα έργα μου»</b><span>Κρατάς σημειώσεις και βάζεις υπενθύμιση για να πάρεις τηλέφωνο την κατάλληλη στιγμή.</span></li>
          </ol>
        </section>
      )}
      {load === 'ready' && (
        <h1 className={s.hello}>
          Βρήκαμε <span>{matches === null ? visible.length : matches} {(matches === null ? visible.length : matches) === 1 ? 'έργο' : 'έργα'}</span>
          {matches === null ? '' : ` για ${PRODUCTS[product].phase.toLowerCase()}`} τις τελευταίες {days} μέρες.
        </h1>
      )}
      <section className={s.kpis} aria-label="Σύνοψη">
        <Kpi k="Νέες άδειες" v={visible.length} sub={`τις τελευταίες ${days} μέρες`} />
        {matches === null ? <Kpi k="Μεγάλα έργα" v={big} sub="πολυκατοικίες, τουριστικά, επαγγελματικά" /> : <Kpi k="Ταιριάζουν σε σένα" v={matches} sub={PRODUCTS[product].label} />}
        <Kpi k="Προεγκρίσεις" v={pre} sub="ξεκινούν σε λίγους μήνες" />
        <Kpi k="Τα έργα μου" v={following} sub="έργα που παρακολουθείς" />
      </section>

      <section className={s.main}>
        <aside className={`card ${s.side}`} aria-label="Λίστα αδειών">
          <div className={s.filters}>
            <div className="field">
              <label htmlFor="product">Τι πουλάς;</label>
              <select id="product" className="input" value={product} onChange={(e) => setProduct(e.target.value)}>
                {productChoices.length > 1 && <option value="all">Όλα τα έργα</option>}
                {PRODUCT_GROUPS.map(([g, label, keys]) => {
                  const ks = keys.filter((k) => productChoices.includes(k));
                  if (!ks.length) return null;
                  return (
                    <optgroup key={g} label={label}>
                      {ks.map((k) => <option key={k} value={k}>{PRODUCTS[k].label}</option>)}
                    </optgroup>
                  );
                })}
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
                  <option value="following">Μόνο «Τα έργα μου»</option>
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
          <div className={s.search}>
            <input className="input" type="search" placeholder="Αναζήτηση δήμου ή έργου" aria-label="Αναζήτηση δήμου ή έργου" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className={s.list}>
            {load === 'loading' && <div className={s.empty}>Φορτώνουν οι άδειες…</div>}
            {load === 'error' && <div className={s.empty}>Δεν φορτώθηκαν οι άδειες. Ανανέωσε τη σελίδα σε λίγο.</div>}
            {load === 'ready' && !visible.length && (
              <div className={s.empty}>
                {view === 'following' ? 'Δεν παρακολουθείς ακόμα κανένα έργο. Άνοιξε μια άδεια και πάτα «+ Στα έργα μου».' : 'Καμία άδεια με αυτά τα φίλτρα. Μεγάλωσε την περίοδο ή αφαίρεσε ένα φίλτρο.'}
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
                      {progressOf(p) && <span className={`${s.prog} ${s['prog_' + progressOf(p).tone]}`}>{progressOf(p).short}</span>}
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

        <div id="dossier" className={`card ${s.dossierCol}`}>
          {current ? (
            <Dossier key={current.ada} p={current} product={product} picked={products} card={card} lead={data.leads[current.ada]} onSave={saveLead} onUnfollow={unfollow} />
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

function Dossier({ p, product, picked, card, lead, onSave, onUnfollow }) {
  const [note, setNote] = useState(lead?.note || '');
  const [remind, setRemind] = useState(lead?.remind_on || '');
  const [saved, setSaved] = useState('');
  const off = stageOffsetMonths(p.stage);
  const maxM = 18;
  const today = Math.max(0, (Date.now() - new Date(p.issued_at).getTime()) / (30.44 * 864e5));
  const phases = phasesFor(p, product === 'all' ? picked : [...picked, product]);
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
        <span className={`pill ${p.stage}`}>{p.stage === 'ok' ? 'Οικοδομική άδεια' : 'Προέγκριση'}</span>
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
        <Fact k="Πρόοδος" v={progressOf(p)?.long || 'Χωρίς νεότερη πράξη'} />
      </div>
      {next}

      <History p={p} />

      <div className={s.sect}>Τι θα χρειαστεί και πότε <span className={s.est}>Εκτίμηση</span></div>
      <div className={s.tl}>
        {phases.map(([name, a0, b0, k]) => [name, ...scaledWin(p, [a0, b0]), k]).map(([name, a, b, k]) => (
          <div key={name} className={`${s.tlRow}${k === product ? ` ${s.mine}` : ''}`}>
            <span>{name}</span>
            <div className={s.track}>{today <= maxM && <i className={s.today} style={{ left: `${(today / maxM) * 100}%` }} />}<div className={s.tlBar} style={{ left: `${(Math.min(a + off, maxM - 1) / maxM) * 100}%`, width: `${((Math.min(b + off, maxM) - Math.min(a + off, maxM - 1)) / maxM) * 100}%` }} /></div>
          </div>
        ))}
        <div className={s.axis}><span /><div><span>άδεια</span><span>6 μήνες</span><span>12</span><span>18</span></div></div>
      </div>
      <p className="fine" style={{ margin: 0 }}>
        <i className={s.todayKey} /> σήμερα{today > maxM ? ` (${Math.round(today)} μήνες από την άδεια)` : ''}. Οι μπάρες είναι τυπικοί χρόνοι για ελληνική οικοδομή, όχι η πραγματική πορεία του έργου. Πραγματικά στοιχεία είναι μόνο οι πράξεις στο «Ιστορικό στη Διαύγεια».
      </p>

      <div className={s.actions}>
        <a className="btn primary" href={`https://diavgeia.gov.gr/doc/${encodeURIComponent(p.ada)}?inline=true`} target="_blank" rel="noopener noreferrer">Άνοιξε την άδεια ↗</a>
        {lead ? (
          <button type="button" className="btn" onClick={() => onUnfollow(p.ada)}>✓ Στα έργα μου · αφαίρεση</button>
        ) : (
          <button type="button" className="btn ghost" onClick={() => onSave(p.ada, { status: 'new' })}>+ Στα έργα μου</button>
        )}
      </div>
      <FindEngineer p={p} />
      <ShareCard p={p} card={card} />
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

function ShareCard({ p, card }) {
  const [copied, setCopied] = useState(false);
  if (!card) {
    return (
      <div className={s.share}>
        <b>Στείλε στον μηχανικό τη δουλειά σου, όχι μόνο ένα τηλέφωνο.</b>
        <span className="fine">Φτιάξε τη σελίδα σου με φωτογραφίες από δουλειές σου και στείλε του το link.</span>
        <Link className="btn small ghost" style={{ alignSelf: 'flex-start' }} href="/app/profile">Φτιάξε το προφίλ σου →</Link>
      </div>
    );
  }
  const text = `Καλησπέρα σας. Είμαι από «${card.name}»${card.headline ? ` (${card.headline})` : ''}. Είδα ότι εκδόθηκε η άδεια για το έργο «${p.title}» (${municipalityName(p.municipality_code)}). Μπορείτε να δείτε δουλειές μας εδώ: ${card.url}\nΘα χαρώ να σας στείλω προσφορά όταν έρθει η ώρα.`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  }
  return (
    <div className={s.share}>
      <b>Στείλε στον μηχανικό τη σελίδα σου</b>
      <span className="fine" style={{ whiteSpace: 'pre-line' }}>{text}</span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button type="button" className="btn small primary" onClick={copy}>{copied ? '✓ Αντιγράφηκε' : 'Αντιγραφή μηνύματος'}</button>
        <a className="btn small" href={`mailto:?subject=${encodeURIComponent(`Για το έργο: ${p.title}`)}&body=${encodeURIComponent(text)}`}>Email</a>
      </div>
    </div>
  );
}

const EVENT_LABEL = {
  update: 'Ενημέρωση άδειας',
  revision: 'Αναθεώρηση άδειας',
  inspection: 'Έλεγχος από ελεγκτή δόμησης',
  completion: 'Πιστοποιητικό ελέγχου κατασκευής',
  revocation: 'Ανάκληση άδειας',
};

// Real status, from later acts on Diavgeia. Null when nothing has been published since the permit.
function progressOf(p) {
  if (!p || !p.events_count) return null;
  const when = p.last_event_at ? new Date(p.last_event_at).toLocaleDateString('el-GR', { month: 'short', year: 'numeric' }) : '';
  if (p.progress === 'revoked') return { tone: 'bad', short: 'Ανακλήθηκε', long: 'Η άδεια ανακλήθηκε' };
  if (p.progress === 'done') return { tone: 'done', short: 'Στο τέλος', long: `Πήρε πιστοποιητικό ελέγχου (${when}): το έργο τελειώνει` };
  return { tone: 'live', short: `Κινείται · ${when}`, long: `Ενεργό: ${EVENT_LABEL[p.last_event_kind]?.toLowerCase() || 'νέα πράξη'} ${when}` };
}

function History({ p }) {
  const [events, setEvents] = useState(null);
  useEffect(() => {
    if (!p.events_count) { setEvents([]); return undefined; }
    let alive = true;
    fetch(`/api/permits/${encodeURIComponent(p.ada)}/events`)
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((j) => alive && setEvents(j.events || []))
      .catch(() => alive && setEvents([]));
    return () => { alive = false; };
  }, [p.ada, p.events_count]);
  return (
    <div className={s.hist}>
      <div className={s.sect}>Ιστορικό στη Διαύγεια <span className={s.real}>Πραγματικό</span></div>
      {events === null && <span className="fine">Φόρτωση…</span>}
      {events && events.length === 0 && (
        <span className="fine">Δεν έχει δημοσιευτεί άλλη πράξη για αυτή την άδεια μετά την έκδοσή της. Όταν βγει ενημέρωση, έλεγχος ή πιστοποιητικό, θα εμφανιστεί εδώ.</span>
      )}
      {events && events.map((e) => (
        <a key={e.ada} className={s.ev} href={e.document_url} target="_blank" rel="noopener noreferrer">
          <span className={`${s.evDot} ${s['ev_' + e.kind]}`} />
          <span style={{ minWidth: 0 }}>
            <b>{EVENT_LABEL[e.kind] || 'Πράξη'}</b> <span className="mono fine">{new Date(e.published_at).toLocaleDateString('el-GR')}</span>
            {e.title && <span className={s.evT}>{e.title}</span>}
          </span>
          <span className="fine">↗</span>
        </a>
      ))}
    </div>
  );
}

// Helps the customer reach the engineer: they read the name in the permit and we open a search.
// Nothing from the document is read or stored by us.
function FindEngineer({ p }) {
  const [name, setName] = useState('');
  const place = municipalityName(p.municipality_code).replace(/^Δήμος\s+/, '');
  const ok = name.trim().length > 2;
  function search(e) {
    e.preventDefault();
    if (!ok) return;
    const q = `${name.trim()} μηχανικός ${place} τηλέφωνο`;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank', 'noopener');
  }
  return (
    <form className={s.find} onSubmit={search}>
      <div className={s.sect}>📞 Βρες το τηλέφωνο του μηχανικού</div>
      <span className="fine">1. Άνοιξε την άδεια και βρες τον <b>επιβλέποντα μηχανικό</b> (συνήθως στον πίνακα «Στοιχεία μηχανικών» ή «Επιβλέποντες»). 2. Γράψε το όνομά του εδώ:</span>
      <div className={s.findRow}>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="π.χ. Παπαδόπουλος Γιώργος" aria-label="Όνομα μηχανικού" />
        <button className="btn primary" type="submit" disabled={!ok}>Βρες τηλέφωνο</button>
      </div>
    </form>
  );
}
