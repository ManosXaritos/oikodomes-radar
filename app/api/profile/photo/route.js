// Upload one photo of a finished job. The browser shrinks it first, so it is small.
import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getSession } from '../../../../lib/session';
import { adminClient } from '../../../../lib/supabase/admin';
import { photoUrl } from '../../../../lib/profile';

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX = 4 * 1024 * 1024;

// Check the file really is the image type it claims to be.
function sniff(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

export async function POST(request) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: 'Συνδέσου πρώτα.' }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form && form.get('file');
  if (!file || typeof file === 'string') return NextResponse.json({ error: 'Δεν στάλθηκε φωτογραφία.' }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: 'Η φωτογραφία είναι πολύ μεγάλη (μέχρι 4 MB).' }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type) return NextResponse.json({ error: 'Δεκτές μόνο φωτογραφίες JPG, PNG ή WEBP.' }, { status: 400 });

  const path = `${user.id}/${randomUUID()}.${TYPES[type]}`;
  const { error } = await adminClient().storage.from('work-photos').upload(path, buf, { contentType: type, upsert: false });
  if (error) return NextResponse.json({ error: 'Δεν ανέβηκε η φωτογραφία. Δοκίμασε ξανά.' }, { status: 500 });
  return NextResponse.json({ ok: true, path, url: photoUrl(path) });
}
