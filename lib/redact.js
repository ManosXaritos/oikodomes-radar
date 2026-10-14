// Removes personal details that some municipalities put in permit titles, so the app never shows
// an owner's name, a cadastral code (ΚΑΕΚ) or a tax number (ΑΦΜ). Data minimisation (GDPR art. 5).
//
// Only cuts text that clearly names a person: "ιδιοκτησίας Παπαδόπουλου Γεώργιου" is removed,
// "οριζόντιας ιδιοκτησίας Β1" or "καθέτου ιδιοκτησίας ΙΙ" (a unit, not a person) stays.

const W = '[A-Za-zΑ-Ωα-ωΆ-Ώά-ώΪΫϊϋΐΰ]';
const OWNER = new RegExp(
  `\\s*[,.;–-]?\\s*(?:ιδιοκτησ[ιί]ας|ιδιοκτ[ηή]τ(?:η|ου|ριας|ρια|ών|ων)|ιδιοκτ[ηή]σεως)\\s+(?:του|της|των|τους|κ\\.|κου|κας\\s+)?\\s*(${W}{3,}\\.?)\\s+(${W}{2,}\\.?)`,
  'giu',
);
const MR = new RegExp(`\\s*,?\\s*(?:του|της|των)\\s+κ(?:\\.|ου|ας|ων)\\s+${W}{2,}\\.?(?:\\s+${W}{2,}\\.?)?(?:\\s+(?:του|της)\\s+${W}{2,})?`, 'giu');
const KAEK = /\s*(?:(?:με|ΜΕ|Με)\s+)?(?:ΚΑΕΚ|Κ\.Α\.Ε\.Κ\.|KAEK)\s*[:.]?\s*[\d][\d/ .]{5,}\d(?:\/\d+)*/gu;
const AFM = /\s*,?\s*(?:(?:με|ΜΕ|Με)\s+)?(?:ΑΦΜ|Α\.Φ\.Μ\.)\s*[:.]?\s*\d{9}/giu;

// Words that look like a name but describe the building/unit instead.
const NOT_NAME = /^(ισογε|υπογε|ορόφ|οροφ|κατοικ|καταστ|γραφε|αποθηκ|διαμερ|κτιρ|οικοπ|γηπεδ|και|με|σε|επί|επι|στο|στη|του|της|των)/iu;

export function redactTitle(input) {
  let t = String(input || '');
  if (!t) return t;
  t = t.replace(KAEK, '').replace(AFM, '').replace(MR, '');
  for (const m of t.matchAll(OWNER)) {
    if (NOT_NAME.test(m[1]) || /^[ΙIVΧX]+$/u.test(m[1])) continue;
    t = t.slice(0, m.index); // the owner's name runs to the end of the title
    break;
  }
  return t.replace(/\s{2,}/g, ' ').replace(/[\s,;:–-]+$/u, '').trim();
}
