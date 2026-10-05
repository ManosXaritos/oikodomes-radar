// Run with: node tests/core.test.js
import assert from 'node:assert/strict';
import { toPermit, fetchNewPermits, cleanTitle, stageOf } from '../lib/diavgeia.js';
import { typeOf, hasPool, fits, needWindow } from '../lib/classify.js';
import { MUNICIPALITIES, UNITS, REGIONS, unitOf, regionOf, municipalityName } from '../lib/geo.js';
import { sanitizeSettings, inArea, allowedUnits, needsSetup, hasAccess } from '../lib/plans.js';

let n = 0;
const t = (name, fn) => {
  fn();
  n++;
};

// Real decisions as returned by Diavgeia's API on 5 Oct 2026 (trimmed).
const sample = [
  { ada: 'ΨΞΛ646Ψ842-0Δ2', subject: 'Ενημέρωση έντυπης Αδείας (ν.4759/2020): ΕΝΗΜΕΡΩΣΗ ΤΗΣ 185/2011 ΟΙΚΟΔΟΜΙΚΗΣ ΑΔΕΙΑΣ', issueDate: 1791203904000, publishTimestamp: 1791204628129, decisionTypeId: '2.4.6.1', status: 'PUBLISHED', extraFieldValues: { municipality: '7301' } },
  { ada: '9ΩΘ746Ψ842-Χ3Ψ', subject: 'Οικοδομική Άδεια (ν.4759/2020): ΝΕΟ ΚΤΙΡΙΟ Κ.Α.Δ. & ΚΟΠΗ 6 ΔΕΝΤΡΩΝ', issueDate: 1791203152000, publishTimestamp: 1791203700651, decisionTypeId: '2.4.6.1', status: 'PUBLISHED', extraFieldValues: { municipality: '5002' } },
  { ada: 'Ψ2ΛΞ46Ψ842-0Δ0', subject: 'Οικοδομική Άδεια (ν.4759/2020): ΝΕΑ ΔΙΩΡΟΦΗ ΟΙΚΟΔΟΜΗ (ΔΥΟ ΚΑΤΟΙΚΙΕΣ) ', issueDate: 1791199228000, publishTimestamp: 1791202838562, decisionTypeId: '2.4.6.1', status: 'PUBLISHED', extraFieldValues: { municipality: '7108' } },
  { ada: '9ΘΝ046Ψ842-ΚΟΩ', subject: 'Προέγκριση Οικοδομικής Αδείας (ν.4759/2020): Ανέγερση διώροφης κατοικίας με υπόγειο', issueDate: 1791199883000, publishTimestamp: 1791200000000, decisionTypeId: '2.4.6.1', status: 'PUBLISHED', extraFieldValues: { municipality: '4611' } },
  { ada: 'ΡΖΖ746Ψ842-ΙΒΓ', subject: 'Έγκριση Εργασιών Δόμησης Μικρής Κλίμακας: ΕΕΔΜΚ διαχωρισμού ενός διαμερίσματος', issueDate: 1791198360000, publishTimestamp: 1791199000000, decisionTypeId: '2.4.6.1', status: 'PUBLISHED', extraFieldValues: { municipality: '0701' } },
  { ada: 'Ρ9ΕΣ46ΝΚΠΔ-Ζ0Χ', subject: 'Περίληψη σύμβασης πρόσληψης αναπληρωτή εκπαιδευτικού', issueDate: 1791222439000, publishTimestamp: 1791222442027, decisionTypeId: 'Γ.3.4', status: 'PUBLISHED', extraFieldValues: {} },
];

t('stage detection', () => {
  assert.equal(stageOf('Οικοδομική Άδεια (ν.4759/2020): X'), 'ok');
  assert.equal(stageOf('Προέγκριση Οικοδομικής Αδείας (ν.4759/2020): X'), 'pre');
  assert.equal(stageOf('Ενημέρωση Οικοδομικής Αδείας (ν.4759/2020): X'), null);
  assert.equal(stageOf('Αναθεώρηση προέγκρισης Οικοδομικής Αδείας: X'), null);
});

t('only new projects become permits', () => {
  const rows = sample.map(toPermit).filter(Boolean);
  assert.deepEqual(rows.map((r) => r.ada), ['9ΩΘ746Ψ842-Χ3Ψ', 'Ψ2ΛΞ46Ψ842-0Δ0', '9ΘΝ046Ψ842-ΚΟΩ']);
  const pre = rows.find((r) => r.ada === '9ΘΝ046Ψ842-ΚΟΩ');
  assert.equal(pre.stage, 'pre');
  assert.equal(pre.municipality_code, '4611');
  assert.equal(rows[1].title, 'ΝΕΑ ΔΙΩΡΟΦΗ ΟΙΚΟΔΟΜΗ (ΔΥΟ ΚΑΤΟΙΚΙΕΣ)');
  assert.equal(rows[1].type, 'multi');
  assert.ok(rows[0].document_url.startsWith('https://diavgeia.gov.gr/doc/'));
});

t('title cleaning keeps mixed-case titles', () => {
  assert.equal(cleanTitle('Οικοδομική Άδεια (ν.4759/2020): Ανέγερση διώροφης κατοικίας'), 'Ανέγερση διώροφης κατοικίας');
});

t('project types', () => {
  const cases = {
    'ΝΕΑ ΜΟΝΟΚΑΤΟΙΚΙΑ ΜΕ ΥΠΟΓΕΙΟ': 'house',
    'ΝΕΑ ΔΥΩΡΟΦΗ ΠΟΛΥΚΑΤΟΙΚΙΑ': 'multi',
    'ΝΕΑ ΠΕΝΤΑΟΡΟΦΗ ΟΙΚΟΔΟΜΗ ΚΑΤΟΙΚΙΩΝ': 'multi',
    'ΝΕΟ 4ΟΡΟΦΟ ΚΤΙΡΙΟ ΚΑΤΟΙΚΙΩΝ ΜΕ ΙΣΟΓΕΙΟ (PILOTIS) ΚΑΙ ΥΠΟΓΕΙΟ': 'multi',
    'ΑΝΕΓΕΡΣΗ ΚΤΙΡΙΟΥ ΜΕ ΧΡΗΣΗ ΤΟΥΡΙΣΤΙΚΩΝ ΚΑΤΟΙΚΙΩΝ': 'tour',
    'ΑΝΕΓΕΡΣΗ ΝΕΟΥ ΚΤΗΡΙΟΥ ΠΡΑΤΗΡΙΟΥ ΥΓΡΩΝ ΚΑΥΣΙΜΩΝ': 'biz',
    'ΑΝΕΓΕΡΣΗ ΙΣΟΓΕΙΑΣ ΑΓΡΟΤΙΚΗΣ ΑΠΟΘΗΚΗΣ': 'agro',
    'Αλλαγή χρήσης αποθήκης σε κατοικία': 'reno',
    'ΠΡΟΣΘΗΚΗ ΚΑΘ ΎΨΟΣ ΚΑΙ ΣΤΑΤΙΚΗ ΕΝΙΣΧΥΣΗ': 'reno',
    'ΑΝΕΓΕΡΣΗ ΔΙΩΡΟΦΗΣ ΚΑΤΟΙΚΙΑΣ ΜΕ ΥΠΟΓΕΙΟ ΚΑΙ ΠΕΡΙΦΡΑΞΗ': 'house',
    'Ανέγερση διώροφης κεραμοσκεπούς οικίας με πισίνα': 'house',
  };
  for (const [title, type] of Object.entries(cases)) assert.equal(typeOf(title), type, title);
  assert.equal(hasPool('ΔΙΩΡΟΦΗ ΟΙΚΟΔΟΜΗ ΜΕ ΚΟΛΥΜΒΗΤΙΚΗ ΔΕΞΑΜΕΝΗ'), true);
});

t('product matching and timing', () => {
  const house = { type: 'house', pool: true, stage: 'ok', issued_at: '2026-10-05T08:00:00Z' };
  assert.equal(fits(house, 'pool'), true);
  assert.equal(fits({ type: 'house', pool: false }, 'pool'), false);
  assert.equal(fits({ type: 'agro' }, 'kitchen'), false);
  const w = needWindow(house, 'windows');
  assert.equal(w.from.getUTCMonth(), 2); // March 2027
  assert.equal(w.from.getUTCFullYear(), 2027);
});

t('areas', () => {
  assert.equal(Object.keys(MUNICIPALITIES).length, 326);
  for (const code of Object.keys(MUNICIPALITIES)) assert.ok(UNITS[unitOf(code)], code);
  assert.equal(regionOf('4912'), '351');
  assert.equal(REGIONS[regionOf('7108')], 'Κρήτη');
  assert.equal(municipalityName('5002'), 'Δήμος Ασπροπύργου');
});

t('plan limits', () => {
  const s = sanitizeSettings('local', { units: ['49', '45'], regions: ['351'], products: ['windows', 'kitchen', 'nope'] });
  assert.deepEqual(s, { units: ['49'], regions: [], products: ['windows'] });
  const r = sanitizeSettings('region', { units: ['49'], regions: ['351', '471'], products: ['windows', 'kitchen'] });
  assert.deepEqual(r, { units: [], regions: ['351'], products: ['windows', 'kitchen'] });
  const local = { plan: 'local', status: 'trialing', units: ['49'], products: ['windows'] };
  assert.equal(inArea(local, '4912'), true);
  assert.equal(inArea(local, '4501'), false);
  assert.deepEqual(allowedUnits({ plan: 'region', regions: ['351'] }), ['45', '46', '47', '48', '49', '50', '51', '52']);
  assert.equal(allowedUnits({ plan: 'pro' }), null);
  assert.equal(hasAccess(local), true);
  assert.equal(hasAccess({ plan: 'local', status: 'canceled' }), false);
  assert.equal(needsSetup({ plan: 'local', units: [], products: [] }), true);
});

// fetchNewPermits pages until it reaches decisions older than `since`.
const fakeFetch = async (url) => {
  const page = Number(new URL(url).searchParams.get('page'));
  const decisions = page === 0 ? sample.slice(0, 3) : sample.slice(3);
  return { ok: true, json: async () => ({ decisions }) };
};
const since = new Date(1791200500000);
const got = await fetchNewPermits(since, { pageSize: 3, fetchImpl: fakeFetch });
assert.deepEqual(got.map((p) => p.ada).sort(), ['9ΩΘ746Ψ842-Χ3Ψ', 'Ψ2ΛΞ46Ψ842-0Δ0'].sort());
n++;

console.log(`All ${n} checks passed.`);
