// Only Vercel's scheduler (which sends the secret) may start the daily jobs.
export function authorizedCron(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function logRun(db, kind, ok, details) {
  await db.from('runs').insert({ kind, ok, details, finished_at: new Date().toISOString() });
}
