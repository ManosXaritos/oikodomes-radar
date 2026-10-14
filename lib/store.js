// Saves permits and later acts from Diavgeia, then links each act to its permit.

export async function savePermitsAndEvents(db, { permits, events }, { backfill = false } = {}) {
  let inserted = 0;
  for (let i = 0; i < permits.length; i += 200) {
    // Backfilled rows keep their real date as created_at, so the morning email doesn't resend them.
    const chunk = permits.slice(i, i + 200).map((p) => (backfill ? { ...p, created_at: p.published_at } : p));
    const { data, error } = await db.from('permits').upsert(chunk, { onConflict: 'ada', ignoreDuplicates: !backfill }).select('ada');
    if (error) throw error;
    inserted += (data || []).length;
  }
  let savedEvents = 0;
  for (let i = 0; i < events.length; i += 300) {
    const { data, error } = await db.from('permit_events').upsert(events.slice(i, i + 300), { onConflict: 'ada', ignoreDuplicates: true }).select('ada');
    if (error) throw error;
    savedEvents += (data || []).length;
  }
  const { data: linked, error } = await db.rpc('link_permit_events');
  if (error) throw error;
  return { permits: inserted, events: savedEvents, linked: linked || 0 };
}
