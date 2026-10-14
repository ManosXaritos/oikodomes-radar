import Link from 'next/link';
import Logo from '../components/Logo';
import Footer from '../components/Footer';
import { getSession } from '../../lib/session';
import { adminClient } from '../../lib/supabase/admin';
import EngineerEditor from './EngineerEditor';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Είσαι μηχανικός; · Νέες Οικοδομές Radar',
  description: 'Δωρεάν για μηχανικούς: οι προμηθευτές και οι τεχνίτες της περιοχής σου σε βρίσκουν για τα έργα σου.',
};

const PERKS = [
  ['Προσφορές χωρίς να ψάχνεις', 'Κουφωματάδες, ηλεκτρολόγοι, υδραυλικοί και προμηθευτές υλικών σε καλούν για τα έργα σου.'],
  ['Εσύ αποφασίζεις', 'Εμφανίζεσαι μόνο στα έργα που δηλώνεις και στους δήμους που διαλέγεις. Σβήνεις τα στοιχεία σου με ένα κλικ.'],
  ['Δωρεάν, πάντα', 'Για μηχανικούς η εγγραφή δεν κοστίζει τίποτα.'],
];

export default async function EngineerPage() {
  const { user } = await getSession();
  let mine = null;
  let claims = [];
  if (user) {
    const db = adminClient();
    const [{ data: e }, { data: c }] = await Promise.all([
      db.from('engineers').select('name,specialty,office,phone,email,municipalities,note,published').eq('user_id', user.id).maybeSingle(),
      db.from('engineer_claims').select('ada,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(200),
    ]);
    mine = e;
    const adas = (c || []).map((x) => x.ada);
    const { data: ps } = adas.length ? await db.from('permits').select('ada,title').in('ada', adas) : { data: [] };
    const titles = Object.fromEntries((ps || []).map((p) => [p.ada, p.title]));
    claims = adas.map((ada) => ({ ada, title: titles[ada] || '' }));
  }
  return (
    <>
      <header className="bar"><div className="wrap"><Logo /></div></header>
      <main className="wrap" style={{ maxWidth: 820, paddingBlock: '40px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span className="eyebrow">Για μηχανικούς</span>
          <h1 className="disp" style={{ margin: 0, fontSize: 'clamp(32px, 5vw, 48px)', lineHeight: 1.08 }}>Άφησε τους προμηθευτές να σε βρουν.</h1>
          <p className="muted" style={{ margin: 0, fontSize: 18, maxWidth: 640 }}>
            Οι συνδρομητές μας είναι τεχνίτες και προμηθευτές που ψάχνουν νέα έργα. Δήλωσε τα έργα σου και θα βλέπουν το τηλέφωνό σου ακριβώς εκεί που το χρειάζονται.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {PERKS.map(([h, t]) => (
            <div key={h} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <b className="disp" style={{ fontSize: 18 }}>{h}</b>
              <span className="muted" style={{ fontSize: 14.5 }}>{t}</span>
            </div>
          ))}
        </div>
        {user ? (
          <EngineerEditor initial={mine} initialClaims={claims} email={user.email} />
        ) : (
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
            <b className="disp" style={{ fontSize: 20 }}>Γράψου σε 1 λεπτό</b>
            <span className="muted">Μπες με Google ή email. Μετά συμπληρώνεις τηλέφωνο, δήμους και τα έργα σου.</span>
            <Link className="btn primary big" href="/login?next=/michanikos">Γράψου δωρεάν</Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
