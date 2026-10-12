import Link from 'next/link';
import Logo from './components/Logo';
import Footer from './components/Footer';
import Pricing from './components/Pricing';
import TradeTimeline from './components/TradeTimeline';
import { latestFeed } from '../lib/publicFeed';
import s from './landing.module.css';

export const revalidate = 3600;

const BEFORE = [
  'Μαθαίνεις για μια νέα οικοδομή όταν δεις τον γερανό. Συχνά ο μηχανικός έχει ήδη διαλέξει.',
  'Γυρνάς με το αυτοκίνητο ψάχνοντας εργοτάξια και χάνεις ώρες κάθε εβδομάδα.',
  'Δουλεύεις μόνο με τους ίδιους 3–4 εργολάβους που ήδη ξέρεις.',
];
const AFTER = [
  'Βλέπεις κάθε νέα άδεια της περιοχής σου την ημέρα που βγαίνει, μήνες πριν τον γερανό.',
  '10 λεπτά με τον καφέ το πρωί: μόνο τα έργα που ταιριάζουν σε αυτό που πουλάς.',
  'Στέλνεις στον μηχανικό το προφίλ σου με τις δουλειές σου και ξεχωρίζεις από την πρώτη επαφή.',
];
const STEPS = [
  ['01', 'Βγαίνει η άδεια', 'Κάθε οικοδομική άδεια δημοσιεύεται στη Διαύγεια. Τη διαβάζουμε το ίδιο πρωί και την κατατάσσουμε.'],
  ['02', 'Τη λαμβάνεις στις 07:30', 'Μόνο όσες είναι στην περιοχή σου και ταιριάζουν σε αυτό που πουλάς, με χάρτη και το επίσημο έγγραφο.'],
  ['03', 'Φτάνεις πρώτος', 'Μιλάς με τον μηχανικό τη σωστή στιγμή, του στέλνεις το προφίλ σου και κρατάς σημειώσεις στο «Τα έργα μου».'],
];
const FAQ = [
  ['Από πού έρχονται οι άδειες;', 'Από τη Διαύγεια, όπου δημοσιεύεται υποχρεωτικά κάθε οικοδομική άδεια. Τις διαβάζουμε κάθε πρωί, τις κατατάσσουμε και σου δείχνουμε μόνο όσες σε αφορούν.'],
  ['Δείχνει ιδιοκτήτες και τηλέφωνα;', 'Όχι. Δείχνουμε το έργο, την περιοχή και το επίσημο έγγραφο, όπου θα βρεις τη διεύθυνση και τον μηχανικό. Ο σωστός δρόμος είναι ο μηχανικός, ο εργολάβος ή το εργοτάξιο.'],
  ['Τι είναι το προφίλ μάστορα;', 'Μια δική σου σελίδα με τις δουλειές σου, φωτογραφίες, περιοχές και τηλέφωνο. Τη στέλνεις στον μηχανικό όταν τον πλησιάζεις, και μπορεί να σου ζητήσει προσφορά από εκεί.'],
  ['Πόσες άδειες θα βλέπω;', 'Σε όλη την Ελλάδα εκδίδονται περίπου 30.000 άδειες τον χρόνο. Στην Αττική βλέπεις συνήθως αρκετές νέες κάθε εβδομάδα.'],
  ['Μπορώ να ακυρώσω;', 'Ναι, με ένα κλικ από τις Ρυθμίσεις. Αν ακυρώσεις μέσα στις 14 δωρεάν μέρες, δεν χρεώνεσαι τίποτα.'],
  ['Παίρνω τιμολόγιο;', 'Ναι. Για κάθε πληρωμή εκδίδεται νόμιμο παραστατικό. Συμπλήρωσε το ΑΦΜ σου για τιμολόγιο.'],
];

const day = (d) => new Date(d).toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' });

function Check({ bad }) {
  return bad ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--bad)" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
  );
}

export default async function Home() {
  const feed = await latestFeed(5);
  const base = new Date();
  base.setUTCDate(1);
  base.setUTCHours(12, 0, 0, 0);

  return (
    <>
      <section id="top" className={`grid-bg ${s.heroWrap}`}>
        <div className={s.ring} style={{ right: -260, top: -180, width: 1100, height: 1100 }} />
        <div className={s.ring} style={{ right: -60, top: 20, width: 700, height: 700 }} />
        <div className={s.ring} style={{ right: 140, top: 220, width: 300, height: 300 }} />

        <header className={`wrap ${s.top}`}>
          <Logo />
          <nav className="nav" aria-label="Κύριο μενού">
            <a className={`navlink ${s.hideSm}`} href="#giati">Γιατί</a>
            <a className={`navlink ${s.hideSm}`} href="#pos">Πώς δουλεύει</a>
            <a className="navlink" href="#times">Τιμές</a>
            <Link className="navlink" href="/login">Σύνδεση</Link>
            <Link className="btn primary" href="/login?plan=region">Δωρεάν δοκιμή</Link>
          </nav>
        </header>

        <div className={`wrap ${s.hero}`}>
          <div className={s.heroText}>
            <span className={s.live}>
              <i />
              {feed.live ? `LIVE · ${feed.week} νέες άδειες αυτή την εβδομάδα` : 'LIVE · νέες άδειες κάθε πρωί από τη Διαύγεια'}
            </span>
            <h1 className={s.h1}>Κάθε νέα οικοδομή στην περιοχή σου. <span>Πριν από τον ανταγωνισμό.</span></h1>
            <p className={s.lead}>
              Διαβάζουμε κάθε πρωί τις νέες οικοδομικές άδειες της Διαύγειας και σου δείχνουμε όσες σε αφορούν, με το πότε ακριβώς θα χρειαστούν αυτό που πουλάς.
            </p>
            <div className={s.ctas}>
              <Link className="btn primary big glow" href="/login?plan=region">Ξεκίνα δωρεάν 14 μέρες →</Link>
              <a className="btn big" href="#times">Δες τις τιμές</a>
            </div>
            <div className={s.trust}><span>Από €29/μήνα + ΦΠΑ</span><span>·</span><span>Χωρίς δέσμευση</span><span>·</span><span>Επίσημα δεδομένα Διαύγειας</span></div>
          </div>
          <div className={s.city}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/iso-radar.svg" alt="Ισομετρική πόλη: οι νέες άδειες φαίνονται ως πράσινα κτίρια που δεν έχουν χτιστεί ακόμα" />
            <div className={s.tag1}>
              <span className="mono">ΝΕΑ ΑΔΕΙΑ · 07:30</span>
              <b>Εξαόροφη πολυκατοικία</b>
              <span>Δήμος Αλίμου · κουφώματα σε 5–9 μήνες</span>
            </div>
            <div className={s.tag2}>
              <span className="mono">ΠΡΟΕΓΚΡΙΣΗ</span>
              <b>Τετραόροφη · Βριλήσσια</b>
            </div>
          </div>
        </div>
      </section>

      <section className={s.feedWrap}>
        <div className="wrap" style={{ paddingBlock: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className={s.feedHead}>
            <span className="eyebrow">Μόλις βγήκαν · πραγματικές άδειες από τη Διαύγεια</span>
          </div>
          <div className={s.feed}>
            {feed.items.map((f, i) => (
              <div key={i} className={s.feedCard}>
                <div className={s.feedTop}>
                  <span className={`pill ${f.stage}`}>{f.stage === 'pre' ? 'ΠΡΟΕΓΚΡΙΣΗ' : 'ΑΔΕΙΑ'}</span>
                  <span className="mono fine">{day(f.date)}</span>
                </div>
                <b>{f.title}</b>
                <span className="muted" style={{ fontSize: 13 }}>{f.place}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main>
        <section id="giati" className={`wrap ${s.section}`}>
          <div className={s.secHead}>
            <span className="eyebrow">Γιατί</span>
            <h2 className={s.h2}>Όποιος φτάνει πρώτος στον μηχανικό, παίρνει τη δουλειά.</h2>
          </div>
          <div className={s.vs}>
            <div className={`card ${s.vsCard}`}>
              <span className="eyebrow" style={{ color: 'var(--bad)' }}>Σήμερα</span>
              {BEFORE.map((t) => <div key={t} className={s.vsRow} style={{ color: '#B6C1BB' }}><Check bad /><span>{t}</span></div>)}
            </div>
            <div className={`card ${s.vsCard} ${s.vsGood}`}>
              <span className="eyebrow">Με το Radar</span>
              {AFTER.map((t) => <div key={t} className={s.vsRow}><Check /><span>{t}</span></div>)}
            </div>
          </div>
        </section>

        <section id="pos" className={`wrap ${s.section}`}>
          <div className={s.secHead}>
            <span className="eyebrow">Πώς δουλεύει</span>
            <h2 className={s.h2}>Τρία βήματα, κάθε πρωί.</h2>
          </div>
          <div className={s.steps}>
            {STEPS.map(([n, t, d]) => (
              <div key={n} className={`card ${s.step}`}>
                <span className={s.stepN}>{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={`wrap ${s.section}`}>
          <div className="grid-bg card" style={{ padding: 'clamp(22px, 4vw, 48px)', borderRadius: 28 }}>
            <TradeTimeline base={base.toISOString()} />
          </div>
        </section>

        <section className={`wrap ${s.section}`}>
          <div className={s.profileBand}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
              <span className="eyebrow">Νέο · Προφίλ μάστορα</span>
              <h2 className={s.h2}>Μην στέλνεις μόνο ένα τηλέφωνο. Στείλε τη δουλειά σου.</h2>
              <p className="muted" style={{ margin: 0, fontSize: 17 }}>
                Φτιάχνεις σε 5 λεπτά μια σελίδα με φωτογραφίες από δουλειές σου, περιοχές και τηλέφωνο. Όταν βρεις μια νέα οικοδομή, στέλνεις το link στον μηχανικό. Σου ζητάει προσφορά με ένα κλικ.
              </p>
            </div>
            <div className={s.profileMock} aria-hidden="true">
              <div className={s.pmHead}><span className={s.pmAvatar}>ΑΠ</span><div><b>Αλουμίνια Παπαδόπουλος</b><span>Κουφώματα · Νότια Προάστια</span></div></div>
              <div className={s.pmGrid}><i /><i /><i /></div>
              <span className={s.pmBtn}>Ζήτα προσφορά</span>
            </div>
          </div>
        </section>

        <section id="times" className={`wrap ${s.section}`}>
          <div className={s.secHead} style={{ alignItems: 'center', textAlign: 'center', marginInline: 'auto' }}>
            <span className="eyebrow">Τιμές</span>
            <h2 className={s.h2}>Μία δουλειά τον χρόνο το πληρώνει πολλές φορές.</h2>
            <p className="muted" style={{ margin: 0 }}>14 μέρες δωρεάν.</p>
          </div>
          <Pricing center />
        </section>

        <section className={`wrap ${s.section}`} style={{ maxWidth: 860 }}>
          <h2 className={s.h2} style={{ textAlign: 'center' }}>Συχνές ερωτήσεις</h2>
          <div className={s.faq}>
            {FAQ.map(([q, a]) => (
              <details key={q} className="card">
                <summary>{q}<span className={s.chev}>+</span></summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={`wrap ${s.section}`}>
          <div className={`grid-bg ${s.cta}`}>
            <div className={s.ring} style={{ left: '50%', top: '50%', width: 900, height: 900, margin: '-450px 0 0 -450px' }} />
            <h2 className={s.h2} style={{ position: 'relative', maxWidth: 760, textAlign: 'center' }}>Η επόμενη πολυκατοικία στην περιοχή σου βγαίνει αύριο το πρωί.</h2>
            <p className="muted" style={{ position: 'relative', margin: 0, fontSize: 17 }}>Δες τις άδειες της περιοχής σου σε 2 λεπτά.</p>
            <Link className="btn primary big glow" style={{ position: 'relative' }} href="/login?plan=region">Ξεκίνα δωρεάν 14 μέρες →</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
