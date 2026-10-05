// Reads new building permits from Diavgeia's free open-data API (https://diavgeia.gov.gr/api/help).
// We only use the public metadata each decision carries: title, type, municipality, dates, ΑΔΑ code.

import { norm, typeOf, hasPool } from './classify.js';

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
  const title = cleanTitle(d.subject);
  const code = d.extraFieldValues && d.extraFieldValues.municipality ? String(d.extraFieldValues.municipality) : null;
  return {
    ada: d.ada,
    subject: String(d.subject).trim(),
    title,
    stage,
    type: typeOf(title),
    pool: hasPool(title),
    municipality_code: code,
    issued_at: new Date(d.issueDate || d.publishTimestamp).toISOString(),
    published_at: new Date(d.publishTimestamp || d.issueDate).toISOString(),
    document_url: `https://diavgeia.gov.gr/doc/${encodeURIComponent(d.ada)}`,
  };
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
