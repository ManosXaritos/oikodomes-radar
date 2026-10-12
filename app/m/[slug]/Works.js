'use client';
import { useState } from 'react';
import s from './profile.module.css';

const TINTS = ['#1B2A24', '#1A2430', '#282420', '#22281F', '#1F2A2A', '#2A2A22'];

export default function Works({ works, cats }) {
  const [f, setF] = useState('all');
  const list = works.filter((w) => f === 'all' || w.category === f);
  return (
    <>
      <div className={s.worksHead}>
        <h2 className={s.h2}>Δουλειές μας</h2>
        {cats.length > 1 && (
          <div className="chips" role="group" aria-label="Φίλτρο">
            <button type="button" className="chip" aria-pressed={f === 'all'} onClick={() => setF('all')}>Όλα</button>
            {cats.map(([k, name]) => (
              <button key={k} type="button" className="chip" aria-pressed={f === k} onClick={() => setF(k)}>{name}</button>
            ))}
          </div>
        )}
      </div>
      <div className={s.works}>
        {list.map((w, i) => (
          <figure key={w.id} className={s.work}>
            <div className={s.photo} style={{ background: `linear-gradient(160deg, ${TINTS[i % TINTS.length]}, #0B100E)` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {w.photo && <img src={w.photo} alt={w.title} loading="lazy" />}
              {w.catName && <span className={s.cat}>{w.catName}</span>}
              {w.via_radar && <span className={s.via}>μέσω Radar</span>}
            </div>
            <figcaption>
              <b>{w.title}</b>
              <span>{[w.place, w.year].filter(Boolean).join(' · ')}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
