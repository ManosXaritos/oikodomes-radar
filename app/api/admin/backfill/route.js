// Admin only: loads one past week of permits and later acts from Diavgeia.
// Called repeatedly (week=0,1,2,…) to fill the last 12 months.
import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/session';
import { adminClient } from '../../../../lib/supabase/admin';
import { fetchRange } from '../../../../lib/diavgeia';
import { savePermitsAndEvents } from '../../../../lib/store';
import { geocodeMissing } from '../../../../lib/geocode';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request) {
  const started = Date.now();
  const { user, profile } = await getSession();
  if (!user || !profile?.is_admin) return NextResponse.json({ error: 'not allowed' }, { status: 403 });
  const url = new URL(request.url);
  const week = Math.min(Math.max(Number(url.searchParams.get('week')) || 0, 0), 60);
  const days = Math.min(Math.max(Number(url.searchParams.get('days')) || 7, 1), 7);
  const part = Math.max(Number(url.searchParams.get('part')) || 0, 0); // which `days`-long slice of the week
  const end = new Date(Date.now() - week * 7 * 864e5 - part * days * 864e5);
  const from = new Date(end.getTime() - days * 864e5);
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL || '';
  const db = adminClient();
  try {
    const got = await fetchRange(from, end, { userAgent: `OikodomesRadar/1.0 (${contact})`, maxPages: 30, deadline: started + 42_000 });
    const saved = await savePermitsAndEvents(db, got, { backfill: true });
    const located = Date.now() < started + 48_000 ? await geocodeMissing(db, { limit: 6, contact, deadline: started + 54_000 }) : 0;
    return NextResponse.json({ ok: true, from: from.toISOString(), to: end.toISOString(), complete: got.complete, found: { permits: got.permits.length, events: got.events.length }, saved, located });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err && err.message ? err.message : err) }, { status: 500 });
  }
}
