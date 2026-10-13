'use client';
import { useState } from 'react';
import Logo from '../../components/Logo';
import { createClient } from '../../../lib/supabase/client';

// After the "forgot password" email link: choose a new password.
export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [state, setState] = useState('idle');
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setState('saving');
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setErr(/session|auth/i.test(error.message) ? 'Ο σύνδεσμος έληξε. Ζήτησε νέο από τη σελίδα σύνδεσης.' : 'Ο κωδικός θέλει τουλάχιστον 8 χαρακτήρες.');
      setState('idle');
      return;
    }
    window.location.assign('/app');
  }

  return (
    <div className="grid-bg" style={{ minHeight: '100vh' }}>
      <main className="wrap" style={{ maxWidth: 480, paddingBlock: '48px 64px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Logo />
        <form onSubmit={submit} className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h1 className="disp" style={{ margin: 0, fontSize: 26 }}>Νέος κωδικός</h1>
          <div className="field">
            <label htmlFor="pw">Κωδικός</label>
            <input id="pw" className="input" type="password" required minLength={8} autoComplete="new-password" placeholder="Τουλάχιστον 8 χαρακτήρες" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {err && <div className="notice bad">{err}</div>}
          <button className="btn primary big" type="submit" disabled={state === 'saving'}>{state === 'saving' ? 'Αποθήκευση…' : 'Αποθήκευση κωδικού'}</button>
        </form>
      </main>
    </div>
  );
}
