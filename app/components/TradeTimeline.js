'use client';
import { useState } from 'react';
import { PRODUCTS, GROUPS, PRODUCT_GROUPS } from '../../lib/classify';

const MAX = 18;
const KEY = ['windows', 'ac', 'floors', 'kitchen', 'pv'];
const monthYear = (base, m) => {
  const d = new Date(base);
  d.setMonth(d.getMonth() + m);
  return d.toLocaleDateString('el-GR', { month: 'long', year: 'numeric' });
};

// "What do you sell?" picker: shows when an example building will need that trade.
export default function TradeTimeline({ base }) {
  const [group, setGroup] = useState('shell');
  const [pick, setPick] = useState('windows');
  const keys = PRODUCT_GROUPS.find(([g]) => g === group)[2];
  const sel = PRODUCTS[pick];
  const rows = [['frame', 'Σκελετός', 1, 5], ...Object.entries(PRODUCTS).filter(([k]) => KEY.includes(k) || k === pick).map(([k, p]) => [k, p.phase, p.win[0], p.win[1]])]
    .sort((a, b) => a[2] - b[2] || a[3] - b[3]);
  const issued = new Date(base).toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="tt">
      <div className="tt-left">
        <span className="eyebrow">Τι πουλάς;</span>
        <h2 className="tt-h2">Ξέρεις πότε θα σε χρειαστεί κάθε έργο.</h2>
        <p className="muted" style={{ margin: 0 }}>{Object.keys(PRODUCTS).length} κατηγορίες, από τα μπετά μέχρι τον καθαρισμό. Διάλεξε τη δική σου:</p>
        <div role="tablist" aria-label="Ομάδες" className="tt-tabs">
          {Object.entries(GROUPS).map(([g, label]) => (
            <button key={g} type="button" role="tab" aria-selected={g === group} onClick={() => { setGroup(g); setPick(PRODUCT_GROUPS.find(([x]) => x === g)[2][0]); }}>
              {label}
            </button>
          ))}
        </div>
        <div className="chips">
          {keys.map((k) => (
            <button key={k} type="button" className="chip" aria-pressed={k === pick} onClick={() => setPick(k)}>{PRODUCTS[k].phase}</button>
          ))}
        </div>
      </div>
      <div className="tt-right">
        <div className="tt-head">
          <b>Πολυκατοικία · Δήμος Αλίμου</b>
          <span className="mono fine">ΑΔΕΙΑ {issued}</span>
        </div>
        {rows.map(([k, name, a, b]) => (
          <div key={k} className={`tt-row${k === pick ? ' on' : ''}`}>
            <span>{name}</span>
            <div className="tt-track"><div style={{ left: `${(a / MAX) * 100}%`, width: `${((b - a) / MAX) * 100}%` }} /></div>
          </div>
        ))}
        <div className="tt-row tt-axis mono"><span /><div><span>άδεια</span><span>6 μήνες</span><span>12</span><span>18</span></div></div>
        <div className="notice good" style={{ marginTop: 6 }}>
          <b style={{ color: 'var(--accent)' }}>{sel.phase}:</b> το έργο θα σε χρειαστεί περίπου <b>{monthYear(base, sel.win[0])} – {monthYear(base, sel.win[1])}</b>. Το Radar σού θυμίζει την ώρα που πρέπει να πάρεις τηλέφωνο.
        </div>
      </div>
    </div>
  );
}
