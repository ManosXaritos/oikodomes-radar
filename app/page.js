import Link from 'next/link';
import Logo from './components/Logo';
import Footer from './components/Footer';
import Pricing from './components/Pricing';
import { PRODUCTS } from '../lib/classify';
import s from './landing.module.css';

const EXAMPLES = [
  { stage: 'ok', title: 'Νέα εξαόροφη οικοδομή με υπόγειο, πυλωτή, σοφίτα και δώμα', place: 'Δήμος Αλίμου', type: 'Πολυκατοικία', when: 'Κουφώματα: Μάρτιος – Ιούλιος 2027' },
  { stage: 'pre', title: 'Νέα τετραόροφη πολυκατοικία', place: 'Δήμος Βριλησσίων', type: 'Πολυκατοικία', when: 'Ξεκινά σε περίπου 3 μήνες' },
  { stage: 'ok', title: 'Ανέγερση διώροφης κατοικίας με πισίνα', place: 'Δήμος Πατρέων', type: 'Μονοκατοικία · πισίνα', when: 'Πισίνα: Απρίλιος – Οκτώβριος 2027' },
];

const FAQ = [
  ['Από πού έρχονται οι άδειες;', 'Από τη Διαύγεια, όπου το κράτος δημοσιεύει υποχρεωτικά κάθε οικοδομική άδεια. Η εφαρμογή τις διαβάζει κάθε πρωί, τις ταξινομεί και σου δείχνει μόνο όσες σε αφορούν.'],
  ['Δείχνει ιδιοκτήτες και τηλέφωνα;', 'Όχι. Σου δείχνει το έργο, την περιοχή και το έγγραφο της άδειας, όπου θα βρεις τη διεύθυνση και τον μηχανικό. Ο σωστός δρόμος είναι ο μηχανικός, ο εργολάβος ή το εργοτάξιο, όχι κλήσεις σε ιδιώτες.'],
  ['Πόσες άδειες βγαίνουν;', 'Σε όλη την Ελλάδα εκδίδονται περίπου 30.000 οικοδομικές άδειες τον χρόνο. Στην Αττική βλέπεις συνήθως αρκετές νέες κάθε εβδομάδα.'],
  ['Μπορώ να ακυρώσω;', 'Ναι, όποτε θέλεις, με ένα κλικ από τις Ρυθμίσεις. Αν ακυρώσεις μέσα στις 14 δωρεάν μέρες, δεν χρεώνεσαι τίποτα.'],
  ['Παίρνω απόδειξη ή τιμολόγιο;', 'Ναι, για κάθε πληρωμή εκδίδεται παραστατικό. Αν θέλεις τιμολόγιο, συμπλήρωσε το ΑΦΜ σου στην πληρωμή.'],
];

export default function Home() {
  return (
    <>
      <header className="bar">
        <div className="wrap">
          <Logo />
          <nav className="nav">
            <a className="btn" href="#times">Τιμές</a>
            <Link className="btn primary" href="/login">Σύνδεση</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className={`wrap ${s.hero}`}>
          <div className={s.heroText}>
            <span className={s.eyebrow}>Για κουφώματα, κουζίνες, κλιματισμό, φωτοβολταϊκά και άλλα</span>
            <h1 className={s.h1}>Μάθε ποιος χτίζει στην περιοχή σου, πριν σηκωθεί ο γερανός.</h1>
            <p className={s.lead}>
              Κάθε πρωί σου στέλνουμε τις νέες οικοδομικές άδειες της περιοχής σου, με το πότε θα χρειαστούν
              αυτό που πουλάς. Φτάνεις πρώτος στον μηχανικό, πριν μάθουν οι ανταγωνιστές.
            </p>
            <div className={s.ctas}>
              <Link className="btn primary big" href="/login?plan=region">Δοκίμασε δωρεάν 14 μέρες</Link>
              <a className="btn big" href="#times">Δες τις τιμές</a>
            </div>
            <p className="fine">Από €29 τον μήνα + ΦΠΑ. Ακυρώνεις όποτε θέλεις.</p>
          </div>

          <div className={`card ${s.mail}`} aria-label="Παράδειγμα πρωινού email">
            <div className={s.mailHead}>
              <span className="disp">Καλημέρα · 3 νέες άδειες</span>
              <span className="fine">07:30</span>
            </div>
            {EXAMPLES.map((e) => (
              <div key={e.title} className={s.mailRow}>
                <span className={`pill ${e.stage}`}>{e.stage === 'ok' ? 'ΑΔΕΙΑ' : 'ΠΡΟΕΓΚΡΙΣΗ'}</span>
                <b>{e.title}</b>
                <span className="fine">{e.place} · {e.type}</span>
                <span className={s.when}>{e.when}</span>
              </div>
            ))}
            <p className="fine" style={{ margin: 0 }}>Πραγματικές άδειες από τη Διαύγεια, Οκτώβριος 2026.</p>
          </div>
        </section>

        <section className={`wrap ${s.section}`}>
          <h2 className={s.h2}>Πώς δουλεύει</h2>
          <ol className={s.steps}>
            <li className="card"><b>Βγαίνει μια νέα άδεια</b><span>Το κράτος τη δημοσιεύει στη Διαύγεια. Τη διαβάζουμε το ίδιο πρωί.</span></li>
            <li className="card"><b>Τη λαμβάνεις στις 7:30</b><span>Μόνο τις άδειες της περιοχής σου που ταιριάζουν σε αυτό που πουλάς, με χάρτη.</span></li>
            <li className="card"><b>Φτάνεις πρώτος</b><span>Μιλάς με τον μηχανικό τη σωστή στιγμή και μπαίνεις στη λίστα του πριν από τους άλλους.</span></li>
          </ol>
        </section>

        <section className={`wrap ${s.section}`}>
          <h2 className={s.h2}>Για ποιους είναι</h2>
          <div className="chips">
            {Object.values(PRODUCTS).map((p) => <span key={p.label} className="chip">{p.label}</span>)}
          </div>
          <p className={s.pitch}>
            Μία πολυκατοικία έχει 60 έως 80 κουφώματα. Αν σου φέρει μία δουλειά τον χρόνο, η συνδρομή έχει πληρωθεί πολλές φορές.
          </p>
        </section>

        <section id="times" className={`wrap ${s.section}`}>
          <h2 className={s.h2}>Τιμές</h2>
          <Pricing />
        </section>

        <section className={`wrap ${s.section}`}>
          <h2 className={s.h2}>Ερωτήσεις</h2>
          <div className={s.faq}>
            {FAQ.map(([q, a]) => (
              <details key={q} className="card">
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
