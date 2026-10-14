// The later acts we found on Diavgeia for one permit (updates, inspections, completion).
import { NextResponse } from 'next/server';
import { getSession } from '../../../../../lib/session';
import { adminClient } from '../../../../../lib/supabase/admin';
import { hasAccess, inArea } from '../../../../../lib/plans';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { user, profile } = await getSession();
  if (!user) return NextResponse.json({ error: 'Συνδέσου πρώτα.' }, { status: 401 });
  if (!hasAccess(profile)) return NextResponse.json({ error: 'Χρειάζεσαι ενεργή συνδρομή.' }, { status: 402 });
  const db = adminClient();
  const ada = decodeURIComponent(params.ada || '');
  const { data: permit } = await db.from('permits').select('ada,municipality_code').eq('ada', ada).eq('hidden', false).maybeSingle();
  if (!permit || !inArea(profile, permit.municipality_code)) return NextResponse.json({ events: [] });
  const { data } = await db.from('permit_events').select('ada,kind,title,published_at,document_url').eq('permit_ada', ada).order('published_at', { ascending: false }).limit(30);
  return NextResponse.json({ events: data || [] });
}
