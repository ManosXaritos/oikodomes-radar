// Builds the morning email for one customer.
import { esc } from './email.js';
import { municipalityName } from './geo.js';
import { TYPES, PRODUCTS, needWindow, fits } from './classify.js';

const day = (d) => new Date(d).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', timeZone: 'Europe/Athens' });
const month = (d) => d.toLocaleDateString('el-GR', { month: 'long', year: 'numeric', timeZone: 'Europe/Athens' });

export function buildDigest({ permits, reminders = [], products, site }) {
  const big = permits.filter((p) => ['multi', 'tour', 'biz'].includes(p.type)).length;
  const parts = [];
  if (permits.length) parts.push(`${permits.length} ${permits.length === 1 ? 'νέα άδεια' : 'νέες άδειες'} στην περιοχή σου${big ? ` · ${big} μεγάλ${big === 1 ? 'ο έργο' : 'α έργα'}` : ''}`);
  if (reminders.length) parts.push(`${reminders.length} ${reminders.length === 1 ? 'υπενθύμιση' : 'υπενθυμίσεις'} για σήμερα`);
  const subject = parts.join(' · ');
  const main = products && products.length === 1 ? products[0] : null;

  const rows = permits
    .map((p) => {
      let when = '';
      if (main && fits(p, main)) {
        const w = needWindow(p, main);
        when = `<div style="font-size:13px;color:#8a5200;margin-top:4px">${esc(PRODUCTS[main].label)}: περίπου ${esc(month(w.from))} – ${esc(month(w.to))}</div>`;
      }
      const stage = p.stage === 'pre'
        ? '<span style="background:#eee6fa;color:#7a4cc2;font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px">ΠΡΟΕΓΚΡΙΣΗ</span>'
        : '<span style="background:#dff2e8;color:#23855c;font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px">ΑΔΕΙΑ</span>';
      return `<tr><td style="padding:14px 0;border-bottom:1px solid #e3e8ee">
        ${stage}
        <div style="font-size:15px;font-weight:600;margin-top:6px;color:#15202e">${esc(p.title)}</div>
        <div style="font-size:13px;color:#5b6878;margin-top:2px">${esc(municipalityName(p.municipality_code))} · ${esc(TYPES[p.type] ? TYPES[p.type].label : '')}${p.pool ? ' · πισίνα' : ''} · ${esc(day(p.issued_at))}</div>
        ${when}
        <div style="margin-top:8px;font-size:13px"><a href="${site}/app?p=${encodeURIComponent(p.ada)}" style="color:#1b3f96">Άνοιξε στην εφαρμογή</a> · <a href="${esc(p.document_url)}" style="color:#1b3f96">Η άδεια στη Διαύγεια</a></div>
      </td></tr>`;
    })
    .join('');

  const remindRows = reminders
    .map((p) => `<tr><td style="padding:12px 14px;background:#fbefd9;border-radius:8px">
        <div style="font-size:15px;font-weight:600;color:#15202e">${esc(p.title)}</div>
        <div style="font-size:13px;color:#5b6878;margin-top:2px">${esc(municipalityName(p.municipality_code))}</div>
        ${p.note ? `<div style="font-size:13px;color:#15202e;margin-top:6px">Σημείωση: ${esc(p.note)}</div>` : ''}
        <div style="margin-top:6px;font-size:13px"><a href="${site}/app?p=${encodeURIComponent(p.ada)}" style="color:#1b3f96">Άνοιξε το έργο</a></div>
      </td></tr><tr><td style="height:8px"></td></tr>`)
    .join('');

  const html = `<!doctype html><html lang="el"><body style="margin:0;background:#eef1f4;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;padding:24px">
    <tr><td style="font-size:20px;font-weight:800;text-transform:uppercase;color:#2452c2;letter-spacing:.3px">Νέες Οικοδομές Radar</td></tr>
    <tr><td style="font-size:15px;color:#15202e;padding-top:8px">Καλημέρα! ${esc(subject)}.</td></tr>
    ${remindRows ? `<tr><td style="padding-top:14px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#8a5200">Υπενθυμίσεις για σήμερα</td></tr><tr><td style="height:6px"></td></tr>${remindRows}` : ''}
    ${rows ? `<tr><td style="padding-top:14px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#5b6878">Νέες άδειες</td></tr>${rows}` : ''}
    <tr><td style="padding-top:18px;font-size:14px"><a href="${site}/app" style="background:#2452c2;color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:9px;font-weight:600;display:inline-block">Δες τον χάρτη</a></td></tr>
    <tr><td style="padding-top:18px;font-size:12px;color:#5b6878">Μίλα με τον μηχανικό ή επισκέψου το εργοτάξιο· μην καλείς ιδιοκτήτες ιδιώτες. Λαμβάνεις αυτό το email ως συνδρομητής. <a href="${site}/app/settings" style="color:#5b6878">Αλλαγή ρυθμίσεων ή διακοπή email</a></td></tr>
  </table></td></tr></table></body></html>`;

  const text = `${subject}\n\n` + [...reminders, ...permits].map((p) => `- ${p.title} (${municipalityName(p.municipality_code)}) ${site}/app?p=${encodeURIComponent(p.ada)}`).join('\n') + `\n\nΡυθμίσεις: ${site}/app/settings`;
  return { subject, html, text };
}
