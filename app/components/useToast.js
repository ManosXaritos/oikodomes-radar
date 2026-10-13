'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

// Small confirmation message at the bottom of the screen: const [toast, show] = useToast(); show('Αποθηκεύτηκε');
export default function useToast() {
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);
  const show = useCallback((text, bad = false) => {
    clearTimeout(timer.current);
    setMsg({ text, bad });
    timer.current = setTimeout(() => setMsg(null), 2600);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  const el = msg ? (
    <div className={`toast${msg.bad ? ' bad' : ''}`} role="status" aria-live="polite">
      {msg.bad ? '!' : '✓'} {msg.text}
    </div>
  ) : null;
  return [el, show];
}
