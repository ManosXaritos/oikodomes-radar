'use client';
import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

const ERRORS = {
  'Invalid login credentials': 'Λάθος email ή κωδικός.',
  'User already registered': 'Υπάρχει ήδη λογαριασμός με αυτό το email. Πάτα «Σύνδεση».',
  'Email not confirmed': 'Ο λογαριασμός δεν έχει επιβεβαιωθεί ακόμα.',
};
const greek = (msg) => ERRORS[msg] || (/rate|seconds/i.test(msg) ? 'Πολλές προσπάθειες. Περίμενε ένα λεπτό και ξαναδοκίμασε.' : /password/i.test(msg) ? 'Ο κωδικός θέλει τουλάχιστον 8 χαρακτήρες.' : 'Κάτι πήγε στραβά. Δοκίμασε ξανά.');

export default function LoginForm({ next, startMode = 'signin' }) {
  const [mode, setMode] = useState(startMode); // signin | signup | forgot
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const callback = (to) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(to)}`;

  async function google() {
    setBusy(true);
    setError('');
    const { error } = await createClient().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callback(next) } });
    if (error) {
      setError('Η σύνδεση με Google δεν είναι διαθέσιμη αυτή τη στιγμή. Χρησιμοποίησε email και κωδικό.');
      setBusy(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setInfo('');
    const supabase = createClient();
    const mail = email.trim();
    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(mail, { redirectTo: callback('/auth/reset') });
      setBusy(false);
      if (error) return setError(greek(error.message));
      return setInfo(`Αν υπάρχει λογαριασμός με το ${mail}, σου στείλαμε σύνδεσμο για νέο κωδικό.`);
    }
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email: mail, password, options: { emailRedirectTo: callback(next) } });
      if (error) {
        setBusy(false);
        return setError(greek(error.message));
      }
      if (data.session) return window.location.assign(next);
      setBusy(false);
      return setInfo(`Σχεδόν έτοιμο: πάτα τον σύνδεσμο που στείλαμε στο ${mail} για να ενεργοποιηθεί ο λογαριασμός.`);
    }
    const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
    if (error) {
      setBusy(false);
      return setError(greek(error.message));
    }
    window.location.assign(next);
  }

  const title = mode === 'signup' ? 'Νέος λογαριασμός' : mode === 'forgot' ? 'Νέος κωδικός' : 'Σύνδεση';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {mode !== 'forgot' && (
        <div className="toggle" role="tablist" style={{ alignSelf: 'stretch', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <button type="button" role="tab" aria-pressed={mode === 'signin'} onClick={() => { setMode('signin'); setError(''); setInfo(''); }}>Σύνδεση</button>
          <button type="button" role="tab" aria-pressed={mode === 'signup'} onClick={() => { setMode('signup'); setError(''); setInfo(''); }}>Νέος λογαριασμός</button>
        </div>
      )}

      {mode !== 'forgot' && (
        <>
          <button type="button" className="btn big" onClick={google} disabled={busy} style={{ background: '#FFFFFF', color: '#1F1F1F', borderColor: '#FFFFFF' }}>
            <GoogleIcon /> Συνέχεια με Google
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted2)', fontSize: 13 }}>
            <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />ή με email<span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </div>
        </>
      )}

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {mode === 'forgot' && <p className="muted" style={{ margin: 0 }}>Γράψε το email σου και θα σου στείλουμε σύνδεσμο για να βάλεις νέο κωδικό.</p>}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" required autoComplete="email" placeholder="onoma@epixeirisi.gr" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {mode !== 'forgot' && (
          <div className="field">
            <label htmlFor="password">Κωδικός</label>
            <input id="password" className="input" type="password" required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder={mode === 'signup' ? 'Τουλάχιστον 8 χαρακτήρες' : ''} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        )}
        {error && <div className="notice bad">{error}</div>}
        {info && <div className="notice good">{info}</div>}
        <button className="btn primary big" type="submit" disabled={busy}>
          {busy ? 'Περίμενε…' : mode === 'signup' ? 'Δημιουργία λογαριασμού' : mode === 'forgot' ? 'Στείλε μου σύνδεσμο' : 'Σύνδεση'}
        </button>
        {mode === 'signin' && <button type="button" className="navlink" style={{ alignSelf: 'center' }} onClick={() => { setMode('forgot'); setError(''); }}>Ξέχασες τον κωδικό;</button>}
        {mode === 'forgot' && <button type="button" className="navlink" style={{ alignSelf: 'center' }} onClick={() => { setMode('signin'); setInfo(''); }}>← Πίσω στη σύνδεση</button>}
      </form>
      <span className="sr-only" aria-live="polite">{title}</span>
    </div>
  );
}
