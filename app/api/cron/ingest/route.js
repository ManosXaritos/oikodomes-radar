// Every morning: pull new building permits from Diavgeia, save them, and locate new municipalities.
import { NextResponse } from 'next/server';
import { adminClient } from '../../../../lib/supabase/admin';
import { fetchNewPermits, fetchRange } from '../../../../lib/diavgeia';
import { savePermitsAndEvents } from '../../../../lib/store';
import { geocodeMissing } from '../../../../lib/geocode';
import { authorizedCron, logRun } from '../../../../lib/cron';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request) {
  const started = Date.now();
  if (!authorizedCron(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const db = adminClient();
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL || '';
  try {
    // Start from the last successful run, with a day of overlap so nothing slips through.
    const { data: last } = await db.from('runs').select('finished_at').eq('kind', 'ingest').eq('ok', true).order('finished_at', { ascending: false }).limit(1).maybeSingle();
    const since = last ? new Date(new Date(last.finished_at).getTime() - 24 * 3600 * 1000) : new Date(Date.now() - 7 * 24 * 3600 * 1000);

    const permits = await fetchNewPermits(since, { userAgent: `OikodomesRadar/1.0 (${contact})`, maxPages: last ? 15 : 20, deadline: started + 25_000 });
    // Later acts (updates, inspections, completion) from the last 3 days, linked to their permits.
    const ua = `OikodomesRadar/1.0 (${contact})`;
    const recent = await fetchRange(new Date(Date.now() - 3 * 864e5), new Date(), { userAgent: ua, maxPages: 12, deadline: started + 40_000 });
    const all = new Map([...recent.permits, ...permits].map((p) => [p.ada, p]));
    const saved = await savePermitsAndEvents(db, { permits: [...all.values()], events: recent.events });
    const inserted = saved.permits;
    const located = await geocodeMissing(db, { limit: 20, contact, deadline: started + 50_000 });
    // Data retention (see /aporrito): quote requests are deleted after 12 months.
    const { count: purged } = await db.from('quote_requests').delete({ count: 'exact' }).lt('created_at', new Date(Date.now() - 365 * 864e5).toISOString());
    const details = { since: since.toISOString(), found: permits.length, inserted, events: saved.events, linked: saved.linked, located, purged: purged || 0 };
    await logRun(db, 'ingest', true, details);
    return NextResponse.json({ ok: true, ...details });
  } catch (err) {
    await logRun(db, 'ingest', false, { error: String(err && err.message ? err.message : err) });
    return NextResponse.json({ ok: false, error: String(err && err.message ? err.message : err) }, { status: 500 });
  }
}
