// Every morning: pull new building permits from Diavgeia, save them, and locate new municipalities.
import { NextResponse } from 'next/server';
import { adminClient } from '../../../../lib/supabase/admin';
import { fetchNewPermits } from '../../../../lib/diavgeia';
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

    const permits = await fetchNewPermits(since, { userAgent: `OikodomesRadar/1.0 (${contact})`, maxPages: last ? 15 : 20, deadline: started + 35_000 });
    let inserted = 0;
    for (let i = 0; i < permits.length; i += 200) {
      const chunk = permits.slice(i, i + 200);
      const { data, error } = await db.from('permits').upsert(chunk, { onConflict: 'ada', ignoreDuplicates: true }).select('ada');
      if (error) throw error;
      inserted += (data || []).length;
    }
    const located = await geocodeMissing(db, { limit: 20, contact, deadline: started + 50_000 });
    const details = { since: since.toISOString(), found: permits.length, inserted, located };
    await logRun(db, 'ingest', true, details);
    return NextResponse.json({ ok: true, ...details });
  } catch (err) {
    await logRun(db, 'ingest', false, { error: String(err && err.message ? err.message : err) });
    return NextResponse.json({ ok: false, error: String(err && err.message ? err.message : err) }, { status: 500 });
  }
}
