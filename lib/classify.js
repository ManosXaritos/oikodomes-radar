// Turns a permit title into a project type, and matches projects to what a seller offers.

export const norm = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase();

export const TYPES = {
  house: { label: 'Μονοκατοικία', short: 'Μονοκατοικία', size: 'Μεσαίο' },
  multi: { label: 'Πολυκατοικία / πολλές κατοικίες', short: 'Πολυκατοικία', size: 'Μεγάλο' },
  tour: { label: 'Τουριστικό', short: 'Τουριστικό', size: 'Μεγάλο' },
  biz: { label: 'Επαγγελματικό', short: 'Επαγγελματικό', size: 'Μεγάλο' },
  reno: { label: 'Ανακαίνιση / προσθήκη', short: 'Ανακαίνιση', size: 'Μικρό' },
  agro: { label: 'Αγροτικό', short: 'Αγροτικό', size: 'Μικρό' },
};

export function typeOf(title) {
  const n = norm(title);
  if (/ΣΙΛΟ|SILO|ΑΓΡΟΤΙΚ|ΣΤΑΒΛ|ΘΕΡΜΟΚΗΠ|ΠΤΗΝΟΤΡΟΦ|ΚΤΗΝΟΤΡΟΦ/.test(n)) return 'agro';
  const isNew = /ΑΝΕΓΕΡΣ|(^|[\s(«"])ΝΕ(Α|Ο|ΕΣ|ΟΥ)\s|ΝΕΟΔΜΗΤ/.test(n);
  if (!isNew && /ΑΛΛΑΓΗ ΧΡΗΣ|ΠΡΟΣΘΗΚ|ΑΝΑΚΑΙΝ|ΑΝΑΣΤΗΛ|ΕΝΙΣΧΥΣ|ΔΙΑΡΡΥΘΜ|ΑΠΟΠΕΡΑΤ|ΚΑΘΑΙΡΕΣ|ΕΠΙΣΚΕΥ|ΝΟΜΙΜΟΠΟΙ|ΜΕΤΑΤΡΟΠ/.test(n)) return 'reno';
  if (/ΚΑΤΑΣΤΗΜ|ΠΡΑΤΗΡΙ|ΔΕΔΟΜΕΝΩΝ|Κ\.Α\.Δ|ΑΠΟΘΗΚΕΥΣΗΣ ΗΛΕΚ|ΒΙΟΤΕΧΝ|ΒΙΟΜΗΧΑΝ|ΓΡΑΦΕΙ|ΕΠΑΓΓΕΛΜΑΤ|LOGISTIC|ΣΧΟΛΕΙ|ΒΡΕΦΟΝΗΠ|ΙΑΤΡΕΙ|ΚΛΙΝΙΚ|ΕΣΤΙΑΤΟΡ|ΣΟΥΠΕΡ ΜΑΡΚΕΤ/.test(n)) return 'biz';
  if (/ΤΟΥΡΙΣΤ|ΕΝΟΙΚΙΑΖ|ΚΑΤΑΛΥΜ|ΞΕΝΟΔΟΧ|ΞΕΝΩΝ|ΒΙΛΛ/.test(n)) return 'tour';
  if (/ΠΟΛΥΚΑΤΟΙΚ|ΠΕΝΤΑΟΡΟΦ|ΕΞΑΟΡΟΦ|ΕΞΑΩΡΟΦ|ΤΕΤΡΑΟΡΟΦ|ΤΕΤΡΑΩΡΟΦ|ΤΡΙΩΡΟΦ|ΤΡΙΟΡΟΦ|\dΟΡΟΦ|\d ΟΡΟΦ|ΣΥΓΚΡΟΤΗΜ|ΚΑΤΟΙΚΙΩΝ|ΔΙΑΜΕΡΙΣΜ|ΔΥΟ ΚΑΤΟΙΚ|ΔΥΟ ΝΕΕΣ|ΔΙΠΛΟΚΑΤ|ΔΥΟ ΥΠΟΣΚ|\d ΚΑΤΟΙΚ/.test(n)) return 'multi';
  return 'house';
}

export const hasPool = (title) => /ΠΙΣΙΝ|ΚΟΛΥΜΒ/.test(norm(title));

// What a seller offers. `fits` = project types it applies to ('pool' = needs a pool or a tourist project).
// `win` = typical months after the permit when the project needs this product.
export const PRODUCTS = {
  windows: { label: 'Κουφώματα / αλουμίνια', fits: ['house', 'multi', 'tour', 'biz', 'reno'], win: [5, 9] },
  kitchen: { label: 'Κουζίνες / ντουλάπες', fits: ['house', 'multi', 'tour', 'reno'], win: [9, 13] },
  ac: { label: 'Κλιματισμός / αντλίες θερμότητας', fits: ['house', 'multi', 'tour', 'biz', 'reno'], win: [6, 10] },
  pv: { label: 'Φωτοβολταϊκά / ηλιακοί', fits: ['house', 'tour', 'biz', 'agro'], win: [9, 14] },
  pool: { label: 'Εξοπλισμός πισίνας', fits: 'pool', win: [6, 12] },
  alarm: { label: 'Συναγερμοί / smart home', fits: ['house', 'tour', 'biz'], win: [10, 14] },
  floors: { label: 'Δάπεδα / πλακάκια', fits: ['house', 'multi', 'tour', 'biz', 'reno'], win: [8, 12] },
  elevator: { label: 'Ανελκυστήρες', fits: ['multi', 'tour', 'biz'], win: [8, 12] },
};

export function fits(permit, product) {
  const p = PRODUCTS[product];
  if (!p) return true;
  if (p.fits === 'pool') return !!permit.pool || permit.type === 'tour';
  return p.fits.includes(permit.type);
}

export const fitsAny = (permit, products) => !products || !products.length || products.some((p) => fits(permit, p));

// Timeline phases shown on each permit.
export const PHASES = [
  ['Σκελετός', 1, 5, null],
  ['Κουφώματα', 5, 9, 'windows'],
  ['Κλιματισμός', 6, 10, 'ac'],
  ['Πισίνα', 6, 12, 'pool'],
  ['Ανελκυστήρας', 8, 12, 'elevator'],
  ['Δάπεδα', 8, 12, 'floors'],
  ['Κουζίνα', 9, 13, 'kitchen'],
  ['Φωτοβολταϊκά', 9, 14, 'pv'],
  ['Συναγερμός', 10, 14, 'alarm'],
];

// A pre-approval comes roughly 3 months before the permit itself.
export const stageOffsetMonths = (stage) => (stage === 'pre' ? 3 : 0);

export function needWindow(permit, product) {
  const p = PRODUCTS[product];
  if (!p) return null;
  const start = new Date(permit.issued_at);
  const off = stageOffsetMonths(permit.stage);
  const from = new Date(start);
  from.setMonth(start.getMonth() + p.win[0] + off);
  const to = new Date(start);
  to.setMonth(start.getMonth() + p.win[1] + off);
  return { from, to };
}
