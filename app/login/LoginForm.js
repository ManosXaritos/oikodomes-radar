'use client';
import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';

export default function LoginForm({ next }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [message, setMessage] = useState('');

  async function submit(e) {
    e.preventDefault();
    setState('sending');
    const supabase = createClient();
    const redirect = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirect } });
    if (error) {
      setState('error');
      setMessage(error.message.includes('rate') ? 'Ζήτησες πολλούς συνδέσμους. Περίμενε ένα λεπτό και ξαναδοκίμασε.' : 'Δεν στάλθηκε το email. Έλεγξε τη διεύθυνση και ξαναδοκίμασε.');
    } else {
      setState('sent');
    }
  }

  if (state === 'sent') {
    return (
      <div className="notice good">
        Σου στείλαμε σύνδεσμο στο <b>{email}</b>. Άνοιξέ τον από αυτή τη συσκευή για να μπεις. Αν δεν τον βλέπεις, κοίτα και στα ανεπιθύμητα.
      </div>
    );
  }
  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" className="input" type="email" required autoComplete="email" placeholder="onoma@epixeirisi.gr" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {state === 'error' && <div className="notice bad">{message}</div>}
      <button className="btn primary big" type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Στέλνουμε…' : 'Στείλε μου σύνδεσμο'}
      </button>
    </form>
  );
}
