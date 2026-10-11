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

// What a seller offers, grouped by stage of the build.
// `fits` = project types it applies to ('pool' = needs a pool or a tourist project).
// `win` = typical months after the permit when the project needs this product.
// `key` = shown on every permit's timeline; the others show only when the seller picked them.
export const GROUPS = {
  build: 'Εργοτάξιο & σκελετός',
  shell: 'Κέλυφος & εξωτερικά',
  mep: 'Ηλεκτρομηχανολογικά',
  finish: 'Εσωτερικά & φινιρίσματα',
  extra: 'Εξοπλισμός & περιβάλλων χώρος',
};

const ALL = ['house', 'multi', 'tour', 'biz', 'reno'];
const NEW = ['house', 'multi', 'tour', 'biz'];

export const PRODUCTS = {
  // Εργοτάξιο & σκελετός
  earthworks: { group: 'build', label: 'Εκσκαφές / χωματουργικά', phase: 'Εκσκαφές', fits: [...NEW, 'agro'], win: [0, 2] },
  concrete: { group: 'build', label: 'Σκυρόδεμα / σίδερα οπλισμού', phase: 'Μπετά & σίδερα', fits: [...NEW, 'agro'], win: [0, 4] },
  scaffold: { group: 'build', label: 'Σκαλωσιές / γερανοί / μηχανήματα', phase: 'Σκαλωσιές', fits: NEW, win: [0, 5] },
  masonry: { group: 'build', label: 'Τούβλα / τοιχοποιίες', phase: 'Τοιχοποιίες', fits: NEW, win: [3, 6] },
  // Κέλυφος & εξωτερικά
  waterproof: { group: 'shell', label: 'Στεγανώσεις / μονώσεις δώματος', phase: 'Στεγανώσεις', fits: ALL, win: [4, 8] },
  roof: { group: 'shell', label: 'Κεραμοσκεπές / στέγες', phase: 'Στέγη', fits: ['house', 'tour', 'agro'], win: [4, 8] },
  windows: { group: 'shell', label: 'Κουφώματα / αλουμίνια', phase: 'Κουφώματα', key: true, fits: ALL, win: [5, 9] },
  facade: { group: 'shell', label: 'Θερμοπρόσοψη / εξωτερική μόνωση', phase: 'Θερμοπρόσοψη', fits: ALL, win: [6, 10] },
  railings: { group: 'shell', label: 'Κάγκελα / σιδηροκατασκευές / γυάλινα', phase: 'Κάγκελα', fits: NEW, win: [8, 12] },
  shading: { group: 'shell', label: 'Περγκόλες / τέντες / σκίαστρα', phase: 'Περγκόλες & τέντες', fits: NEW, win: [11, 15] },
  // Ηλεκτρομηχανολογικά
  electrical: { group: 'mep', label: 'Ηλεκτρολογικά / υλικά ηλεκτρολόγου', phase: 'Ηλεκτρολογικά', fits: [...ALL, 'agro'], win: [4, 9] },
  plumbing: { group: 'mep', label: 'Υδραυλικά / σωληνώσεις', phase: 'Υδραυλικά', fits: ALL, win: [4, 9] },
  heating: { group: 'mep', label: 'Θέρμανση / ενδοδαπέδια / λέβητες', phase: 'Θέρμανση', fits: ALL, win: [5, 9] },
  ac: { group: 'mep', label: 'Κλιματισμός / αντλίες θερμότητας', phase: 'Κλιματισμός', key: true, fits: ALL, win: [6, 10] },
  fire: { group: 'mep', label: 'Πυρασφάλεια / πυρόσβεση', phase: 'Πυρασφάλεια', fits: ['multi', 'tour', 'biz'], win: [7, 11] },
  elevator: { group: 'mep', label: 'Ανελκυστήρες', phase: 'Ανελκυστήρας', fits: ['multi', 'tour', 'biz'], win: [8, 12] },
  pv: { group: 'mep', label: 'Φωτοβολταϊκά / ηλιακοί', phase: 'Φωτοβολταϊκά', key: true, fits: ['house', 'tour', 'biz', 'agro'], win: [9, 14] },
  // Εσωτερικά & φινιρίσματα
  drywall: { group: 'finish', label: 'Γυψοσανίδες / ψευδοροφές', phase: 'Γυψοσανίδες', fits: ALL, win: [6, 10] },
  plaster: { group: 'finish', label: 'Σοβάδες / επιχρίσματα', phase: 'Σοβάδες', fits: ALL, win: [6, 9] },
  floors: { group: 'finish', label: 'Δάπεδα / πλακάκια', phase: 'Δάπεδα', key: true, fits: ALL, win: [8, 12] },
  marble: { group: 'finish', label: 'Μάρμαρα / πέτρα', phase: 'Μάρμαρα', fits: NEW, win: [8, 12] },
  sanitary: { group: 'finish', label: 'Είδη υγιεινής / μπάνια', phase: 'Μπάνια', fits: ALL, win: [9, 13] },
  kitchen: { group: 'finish', label: 'Κουζίνες / ντουλάπες', phase: 'Κουζίνα', key: true, fits: ['house', 'multi', 'tour', 'reno'], win: [9, 13] },
  fireplace: { group: 'finish', label: 'Τζάκια / ενεργειακά τζάκια', phase: 'Τζάκι', fits: ['house', 'tour'], win: [9, 13] },
  paint: { group: 'finish', label: 'Βαφές / χρώματα', phase: 'Βαφές', fits: ALL, win: [10, 13] },
  doors: { group: 'finish', label: 'Πόρτες ασφαλείας / εσωτερικές πόρτες', phase: 'Πόρτες', fits: ALL, win: [10, 14] },
  // Εξοπλισμός & περιβάλλων χώρος
  pool: { group: 'extra', label: 'Εξοπλισμός πισίνας', phase: 'Πισίνα', key: true, fits: 'pool', win: [6, 12] },
  alarm: { group: 'extra', label: 'Συναγερμοί / κάμερες / smart home', phase: 'Συναγερμός', fits: ['house', 'tour', 'biz'], win: [10, 14] },
  garage: { group: 'extra', label: 'Γκαραζόπορτες / αυτοματισμοί', phase: 'Γκαραζόπορτα', fits: NEW, win: [10, 14] },
  lighting: { group: 'extra', label: 'Φωτισμός', phase: 'Φωτισμός', fits: ALL, win: [10, 14] },
  furniture: { group: 'extra', label: 'Έπιπλα / εξοπλισμός καταλυμάτων', phase: 'Έπιπλα', fits: ['house', 'tour', 'biz'], win: [12, 16] },
  garden: { group: 'extra', label: 'Κήπος / άρδευση / περιφράξεις', phase: 'Κήπος', fits: ['house', 'tour', 'biz'], win: [12, 16] },
  cleaning: { group: 'extra', label: 'Καθαρισμοί μετά την κατασκευή', phase: 'Καθαρισμός', fits: ALL, win: [13, 16] },
};

// Product keys grouped, in display order: [[groupKey, groupLabel, [productKey…]], …]
export const PRODUCT_GROUPS = Object.entries(GROUPS).map(([g, label]) => [
  g,
  label,
  Object.keys(PRODUCTS).filter((k) => PRODUCTS[k].group === g),
]);

export function fits(permit, product) {
  const p = PRODUCTS[product];
  if (!p) return true;
  if (p.fits === 'pool') return !!permit.pool || permit.type === 'tour';
  return p.fits.includes(permit.type);
}

export const fitsAny = (permit, products) => !products || !products.length || products.some((p) => fits(permit, p));

// Timeline phases: [name, fromMonth, toMonth, productKey], sorted by start.
export const PHASES = [
  ['Σκελετός', 1, 5, null],
  ...Object.entries(PRODUCTS).map(([k, p]) => [p.phase, p.win[0], p.win[1], k]),
].sort((a, b) => a[1] - b[1] || a[2] - b[2]);

// Phases to draw for one permit: the skeleton, the key trades, and whatever the seller picked.
export const phasesFor = (permit, picked = []) =>
  PHASES.filter(([, , , k]) => !k || ((PRODUCTS[k].key || picked.includes(k)) && fits(permit, k)));

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
