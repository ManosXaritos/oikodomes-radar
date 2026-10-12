// «Ζήτα προσφορά» from a public profile. Saves the request and emails the tradesman.
import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { adminClient } from '../../../lib/supabase/admin';
import { hasAccess } from '../../../lib/plans';
import { sendEmail, esc } from '../../../lib/email';
import { siteUrl } from '../../../lib/stripe';

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  if (b.website) return NextResponse.json({ ok: true }); // hidden field: only robots fill it in
  const slug = str(b.slug, 80);
  const req = {
    name: str(b.name, 100),
    phone: str(b.phone, 30).replace(/[^\d+ ]/g, ''),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str(b.email, 120)) ? str(b.email, 120) : '',
    project: str(b.project, 60),
    area: str(b.area, 80),
    message: str(b.message, 2000),
  };
  if (req.name.length < 2) return NextResponse.json({ error: 'Γράψε το όνομά σου.' }, { status: 400 });
  if (req.phone.replace(/\D/g, '').length < 10 && !req.email) return NextResponse.json({ error: 'Γράψε ένα τηλέφωνο ή email για να σε βρει.' }, { status: 400 });

  const db = adminClient();
  const { data: prof } = await db.from('business_profiles').select('user_id,name,published').eq('slug', slug).maybeSingle();
  if (!prof || !prof.published) return NextResponse.json({ error: 'Η σελίδα δεν βρέθηκε.' }, { status: 404 });
  const { data: owner } = await db.from('profiles').select('email,plan,status').eq('id', prof.user_id).maybeSingle();
  if (!hasAccess(owner)) return NextResponse.json({ error: 'Η σελίδα δεν βρέθηκε.' }, { status: 404 });

  // At most 5 requests per hour from the same connection.
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  const ip_hash = createHash('sha256').update(`${ip}|${process.env.CRON_SECRET || ''}`).digest('hex').slice(0, 32);
  const { count } = await db.from('quote_requests').select('id', { count: 'exact', head: true }).eq('ip_hash', ip_hash).gte('created_at', new Date(Date.now() - 3600e3).toISOString());
  if ((count || 0) >= 5) return NextResponse.json({ error: 'Έστειλες πολλά αιτήματα. Δοκίμασε ξανά σε λίγο.' }, { status: 429 });

  const { error } = await db.from('quote_requests').insert({ ...req, profile_user_id: prof.user_id, ip_hash });
  if (error) return NextResponse.json({ error: 'Δεν στάλθηκε. Δοκίμασε ξανά.' }, { status: 500 });

  if (owner?.email && process.env.RESEND_API_KEY) {
    const rows = [['Όνομα', req.name], ['Τηλέφωνο', req.phone], ['Email', req.email], ['Έργο', req.project], ['Περιοχή', req.area], ['Μήνυμα', req.message]].filter(([, v]) => v);
    await sendEmail({
      to: owner.email,
      subject: `Νέο αίτημα προσφοράς από ${req.name}`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5">
        <p>Κάποιος ζήτησε προσφορά από τη σελίδα σου στο Radar:</p>
        <table cellpadding="6" style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="color:#666">${esc(k)}</td><td><b>${esc(v).replace(/\n/g, '<br>')}</b></td></tr>`).join('')}</table>
        <p><a href="${siteUrl()}/app/profile">Δες όλα τα αιτήματα</a></p></div>`,
      text: `Νέο αίτημα προσφοράς\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${siteUrl()}/app/profile`,
    }).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
