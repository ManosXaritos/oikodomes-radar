// Reads new building permits from Diavgeia's free open-data API (https://diavgeia.gov.gr/api/help).
// We only use the public metadata each decision carries: title, type, municipality, dates, ΑΔΑ code.

import { norm, typeOf, hasPool } from './classify.js';
import { niceTitle } from './titleCase.js';
import { redactTitle } from './redact.js';

const BASE = 'https://diavgeia.gov.gr/opendata/search/advanced';
const QUERY = 'subject:"Οικοδομική Άδεια"';
const PERMIT_DECISION_TYPE = '2.4.6.1';

// Keep the words after "Οικοδομική Άδεια (ν.4759/2020):".
export function cleanTitle(subject) {
  let t = String(subject || '').replace(/\s+/g, ' ').trim();
  const i = t.indexOf(':');
  if (i > -1 && i < 80) t = t.slice(i + 1).trim();
  t = t.replace(/^[«"']+|[»"']+$/g, '').trim();
  // ALL-CAPS titles are kept as written: Greek capitals carry no accents, so lowercasing them
  // would produce misspelled words.
  t = t.replace(/\bPILOTIS\b/g, 'ΠΥΛΩΤΗ').replace(/\bpilotis\b/g, 'πυλωτή');
  t = redactTitle(t);
  return t || 'Οικοδομική άδεια';
}

// 'ok' = permit issued, 'pre' = pre-approval (earlier stage). Anything else (updates, revisions,
// small-scale approvals) is not a new project, so we skip it.
export function stageOf(subject) {
  const n = norm(subject).trim();
  if (n.startsWith('ΟΙΚΟΔΟΜΙΚΗ ΑΔΕΙΑ')) return 'ok';
  if (n.startsWith('ΠΡΟΕΓΚΡΙΣΗ ΟΙΚΟΔΟΜΙΚΗΣ ΑΔΕΙΑΣ')) return 'pre';
  return null;
}

// One Diavgeia decision -> one row for our `permits` table, or null if it isn't a new project.
export function toPermit(d) {
  if (!d || !d.ada || !d.subject) return null;
  if (d.decisionTypeId && d.decisionTypeId !== PERMIT_DECISION_TYPE) return null;
  if (d.status && d.status !== 'PUBLISHED') return null;
  const stage = stageOf(d.subject);
  if (!stage) return null;
  const raw = cleanTitle(d.subject);
  const title = niceTitle(raw);
  const code = d.extraFieldValues && d.extraFieldValues.municipality ? String(d.extraFieldValues.municipality) : null;
  return {
    ada: d.ada,
    subject: String(d.subject).trim(),
    protocol_number: d.protocolNumber ? String(d.protocolNumber).trim() : null,
    title_key: titleKey(d.subject),
    title,
    stage,
    type: typeOf(raw),
    pool: hasPool(raw),
    municipality_code: code,
    issued_at: new Date(d.issueDate || d.publishTimestamp).toISOString(),
    published_at: new Date(d.publishTimestamp || d.issueDate).toISOString(),
    document_url: `https://diavgeia.gov.gr/doc/${encodeURIComponent(d.ada)}`,
  };
}

// A comparable form of the project description, used to match an update to its permit when the
// update doesn't mention the permit number.
export function titleKey(subject) {
  const k = norm(cleanTitle(subject)).replace(/[^A-ZΑ-Ω0-9]+/g, ' ').trim();
  return k.length >= 40 ? k.slice(0, 160) : null;
}

// Later acts about an existing permit: proof that a project is alive, inspected, finished or cancelled.
// Returns null for new permits (handled by toPermit) and for unrelated acts.
export function eventKind(subject) {
  const n = norm(subject).trim();
  const head = n.split(':')[0];
  if (head.includes('ΜΙΚΡΗΣ ΚΛΙΜΑΚΑΣ') || head.includes('ΚΑΤΕΔΑΦΙΣ') || head.includes('ΚΕΡΑΙΑΣ')) return null;
  if (/ΠΙΣΤΟΠΟΙΗΤΙΚ\S* ΕΛΕΓΧΟΥ/.test(n)) return 'completion'; // also «ΕΚΔΟΣΗ ΠΙΣΤΟΠΟΙΗΤΙΚΟΥ ΕΛΕΓΧΟΥ»
  if (/^(ΑΠΟΦΑΣΗ )?ΑΝΑΚΛΗΣΗ(Σ)? .*ΟΙΚΟΔΟΜΙΚΗΣ ΑΔΕΙΑΣ/.test(n)) return 'revocation';
  if (n.includes('ΠΟΡΙΣΜΑ')) return 'inspection';
  if (n.startsWith('ΕΝΗΜΕΡΩΣΗ') && n.includes('ΑΔΕΙ')) return 'update';
  if ((n.startsWith('ΑΝΑΘΕΩΡΗΣΗ') || n.startsWith('ΠΡΟΕΓΚΡΙΣΗ ΓΙΑ ΑΝΑΘΕΩΡΗΣΗ')) && n.includes('ΑΔΕΙ')) return 'revision';
  return null;
}

export function toEvent(d) {
  if (!d || !d.ada || !d.subject) return null;
  if (d.status && d.status !== 'PUBLISHED') return null;
  const kind = eventKind(d.subject);
  if (!kind) return null;
  const own = d.protocolNumber ? String(d.protocolNumber).trim() : '';
  const raw = String(d.subject).replace(/\s+/g, ' ');
  // e-Άδειες numbers are 5-8 digits; skip years, ΚΑΕΚ (12 digits) and the act's own number.
  const refs = [...new Set((raw.match(/(?<![\d/])\d{5,8}(?![\d])/g) || []).filter((x) => x !== own))].slice(0, 6);
  let title = cleanTitle(raw);
  if (title === 'Οικοδομική άδεια') title = '';
  return {
    ada: d.ada,
    kind,
    protocol_number: own || null,
    title: niceTitle(title).slice(0, 220),
    refs,
    title_key: titleKey(raw),
    municipality_code: d.extraFieldValues && d.extraFieldValues.municipality ? String(d.extraFieldValues.municipality) : null,
    published_at: new Date(d.publishTimestamp || d.issueDate).toISOString(),
    document_url: `https://diavgeia.gov.gr/doc/${encodeURIComponent(d.ada)}`,
  };
}

const EVENT_QUERY = '(subject:"ΠΟΡΙΣΜΑ" OR subject:"ΠΙΣΤΟΠΟΙΗΤΙΚΟ ΕΛΕΓΧΟΥ ΚΑΤΑΣΚΕΥΗΣ" OR subject:"Ανάκληση" OR subject:"Αναθεώρηση") AND decisionTypeUid:"2.4.6.1"';

// Every permit and later act issued between two dates (used to load past months).
export async function fetchRange(from, to, { pageSize = 100, maxPages = 40, fetchImpl = fetch, userAgent, deadline = Infinity } = {}) {
  const dt = (x) => x.toISOString().slice(0, 19);
  const range = `issueDate:[DT(${dt(from)}) TO DT(${dt(to)})]`;
  const permits = new Map();
  const events = new Map();
  let complete = true;
  for (const q of [`subject:"Οικοδομική Άδεια" AND ${range}`, `${EVENT_QUERY} AND ${range}`]) {
    for (let page = 0; page < maxPages; page++) {
      if (Date.now() > deadline) { complete = false; break; }
      const res = await fetchImpl(`${BASE}?q=${encodeURIComponent(q)}&size=${pageSize}&page=${page}`, {
        headers: { Accept: 'application/json', 'User-Agent': userAgent || 'OikodomesRadar/1.0' },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`Diavgeia returned ${res.status} on page ${page}`);
      const list = (await res.json()).decisions || [];
      for (const d of list) {
        const p = toPermit(d);
        if (p) permits.set(p.ada, p);
        else {
          const e = toEvent(d);
          if (e) events.set(e.ada, e);
        }
      }
      if (list.length < pageSize) break;
      if (page === maxPages - 1) complete = false;
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  return { permits: [...permits.values()], events: [...events.values()], complete };
}

// Fetch every permit published after `since` (a Date). Results come newest first, so we page
// until we reach older decisions. `maxPages` protects against runaway loops.
export async function fetchNewPermits(since, { maxPages = 25, pageSize = 100, fetchImpl = fetch, userAgent, deadline = Infinity } = {}) {
  const sinceMs = since.getTime();
  const out = new Map();
  let reachedOld = false;
  for (let page = 0; page < maxPages && !reachedOld; page++) {
    if (Date.now() > deadline) break; // save what we have; the next run continues
    const url = `${BASE}?q=${encodeURIComponent(QUERY)}&size=${pageSize}&page=${page}`;
    const res = await fetchImpl(url, {
      headers: { Accept: 'application/json', 'User-Agent': userAgent || 'OikodomesRadar/1.0' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Diavgeia returned ${res.status} on page ${page}`);
    const json = await res.json();
    const list = json.decisions || [];
    for (const d of list) {
      const ts = d.publishTimestamp || d.submissionTimestamp || d.issueDate || 0;
      if (ts < sinceMs) {
        reachedOld = true;
        continue;
      }
      const p = toPermit(d);
      if (p) out.set(p.ada, p);
    }
    if (list.length < pageSize) break;
    // Be polite to a public service.
    await new Promise((r) => setTimeout(r, 400));
  }
  return [...out.values()];
}
