// Every morning, after the robot runs: email each customer the new permits in their area.
import { NextResponse } from 'next/server';
import { adminClient } from '../../../../lib/supabase/admin';
import { authorizedCron, logRun } from '../../../../lib/cron';
import { ACTIVE_STATUSES, allowedUnits } from '../../../../lib/plans';
import { fitsAny } from '../../../../lib/classify';
import { buildDigest } from '../../../../lib/digest';
import { sendEmail } from '../../../../lib/email';
import { siteUrl } from '../../../../lib/stripe';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request) {
  if (!authorizedCron(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const db = adminClient();
  const started = Date.now();
  let sent = 0, skipped = 0, failed = 0;
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Athens' }); // YYYY-MM-DD
  const { data: customers } = await db.from('profiles').select('*').eq('digest', true).in('status', ACTIVE_STATUSES).not('plan', 'is', null);

  for (const c of customers || []) {
    if (Date.now() - started > 50_000) break; // anyone left gets theirs on the next run
    const since = c.last_digest_at || new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const units = allowedUnits(c);
    if (units && !units.length) { skipped++; continue; } // hasn't chosen an area yet
    let q = db.from('permits').select('*').gt('created_at', since).order('published_at', { ascending: false }).limit(300);
    if (units) q = q.in('unit_code', units);
    const { data: permits } = await q;
    const list = (permits || []).filter((p) => fitsAny(p, c.products));
    // Projects the customer asked to be reminded about today.
    const { data: due } = await db.from('saved_leads').select('ada,note,permits(*)').eq('user_id', c.id).eq('remind_on', today);
    const reminders = (due || []).filter((d) => d.permits).map((d) => ({ ...d.permits, note: d.note }));
    const now = new Date().toISOString();
    if ((!list.length && !reminders.length) || !c.email) {
      await db.from('profiles').update({ last_digest_at: now }).eq('id', c.id);
      skipped++;
      continue;
    }
    try {
      const mail = buildDigest({ permits: list, reminders, products: c.products, site: siteUrl() });
      await sendEmail({ to: c.email, ...mail });
      await db.from('profiles').update({ last_digest_at: now }).eq('id', c.id);
      sent++;
    } catch (err) {
      console.error('Digest failed for', c.id, err);
      failed++;
    }
  }
  await logRun(db, 'digest', failed === 0, { sent, skipped, failed });
  return NextResponse.json({ ok: failed === 0, sent, skipped, failed });
}
