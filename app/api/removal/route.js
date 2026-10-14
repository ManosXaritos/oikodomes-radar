// «Αφαίρεση στοιχείων»: a person linked to a permit asks us to stop showing it (GDPR art. 17/21).
// We hide the permit straight away and keep a record of the request.
import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { adminClient } from '../../../lib/supabase/admin';
import { sendEmail, esc } from '../../../lib/email';

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Accepts a bare ΑΔΑ or a full diavgeia.gov.gr link.
function adaFrom(input) {
  const s = str(input, 300);
  const m = s.match(/diavgeia\.gov\.gr\/(?:doc|decision\/view)\/([^/?#\s]+)/i);
  return decodeURIComponent(m ? m[1] : s).trim().toUpperCase().replace(/\s+/g, '');
}

export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  if (b.website) return NextResponse.json({ ok: true }); // robots only
  const ada = adaFrom(b.ada);
  const row = {
    ada,
    name: str(b.name, 100),
    email: str(b.email, 120),
    reason: str(b.reason, 1000),
  };
  if (!/^[0-9A-ZΑ-Ω-]{6,40}$/u.test(ada)) return NextResponse.json({ error: 'Γράψε τον ΑΔΑ ή το link της πράξης στη Διαύγεια.' }, { status: 400 });
  if (row.name.length < 2) return NextResponse.json({ error: 'Γράψε το ονοματεπώνυμό σου.' }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) return NextResponse.json({ error: 'Γράψε ένα σωστό email για να σου απαντήσουμε.' }, { status: 400 });

  const db = adminClient();
  const ip = request.ip || request.headers.get('x-real-ip') || (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  const ip_hash = createHash('sha256').update(`${ip}|${process.env.CRON_SECRET || ''}`).digest('hex').slice(0, 32);
  const { count } = await db.from('removal_requests').select('id', { count: 'exact', head: true }).eq('ip_hash', ip_hash).gte('created_at', new Date(Date.now() - 3600e3).toISOString());
  if ((count || 0) >= 5) return NextResponse.json({ error: 'Έστειλες πολλά αιτήματα. Δοκίμασε ξανά σε λίγο ή στείλε μας email.' }, { status: 429 });

  const { data: permit } = await db.from('permits').select('ada').eq('ada', ada).maybeSingle();
  const { error } = await db.from('removal_requests').insert({ ...row, ip_hash, done: !!permit });
  if (error) return NextResponse.json({ error: 'Δεν στάλθηκε. Δοκίμασε ξανά.' }, { status: 500 });
  if (permit) await db.from('permits').update({ hidden: true }).eq('ada', ada);

  const admin = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  if (admin && process.env.RESEND_API_KEY) {
    await sendEmail({
      to: admin,
      subject: `Αίτημα αφαίρεσης: ${ada}`,
      html: `<p>Νέο αίτημα αφαίρεσης.</p><p>ΑΔΑ: <b>${esc(ada)}</b> (${permit ? 'κρύφτηκε αυτόματα' : 'δεν υπάρχει στη βάση μας'})<br>Όνομα: ${esc(row.name)}<br>Email: ${esc(row.email)}<br>Λόγος: ${esc(row.reason || '-')}</p><p>Απάντησε στον αιτούντα μέσα σε 30 ημέρες (ΓΚΠΔ άρθρο 12).</p>`,
      text: `Αίτημα αφαίρεσης\nΑΔΑ: ${ada} (${permit ? 'κρύφτηκε' : 'δεν υπάρχει'})\nΌνομα: ${row.name}\nEmail: ${row.email}\nΛόγος: ${row.reason || '-'}`,
    }).catch(() => {});
  }
  return NextResponse.json({ ok: true, found: !!permit });
}
