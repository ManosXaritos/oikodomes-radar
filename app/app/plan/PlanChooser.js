'use client';
import { useState } from 'react';
import Pricing from '../../components/Pricing';
import { PLANS } from '../../../lib/plans';

export default function PlanChooser({ preselect }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function choose(plan, interval) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan, interval }) });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || 'Δεν ξεκίνησε η πληρωμή. Δοκίμασε ξανά.');
      window.location.href = json.url;
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <>
      {preselect && PLANS[preselect] && (
        <div className="notice">
          Είχες διαλέξει το <b>{PLANS[preselect].name}</b>. Πάτα «Ξεκίνα με {PLANS[preselect].name}» για να συνεχίσεις.
        </div>
      )}
      {error && <div className="notice bad">{error}</div>}
      <Pricing onChoose={choose} busy={busy} />
    </>
  );
}
