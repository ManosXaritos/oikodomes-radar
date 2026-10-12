// Loads a public profile with its jobs. Server-only.
import { adminClient } from './supabase/admin.js';
import { hasAccess } from './plans.js';
import { photoUrl } from './profile.js';

export async function loadPublicProfile(slug) {
  if (!/^[a-z0-9-]{3,60}$/.test(slug)) return null;
  const db = adminClient();
  const { data: p } = await db.from('business_profiles').select('*').eq('slug', slug).maybeSingle();
  if (!p || !p.published) return null;
  const { data: owner } = await db.from('profiles').select('plan,status').eq('id', p.user_id).maybeSingle();
  if (!hasAccess(owner)) return null;
  const [{ data: works }, { count: won }] = await Promise.all([
    db.from('profile_works').select('id,title,place,year,category,photo_path,via_radar').eq('user_id', p.user_id).order('sort').order('created_at'),
    db.from('saved_leads').select('ada', { count: 'exact', head: true }).eq('user_id', p.user_id).eq('status', 'won'),
  ]);
  return {
    ...p,
    won: won || 0,
    works: (works || []).map((w) => ({ ...w, photo: photoUrl(w.photo_path) })),
  };
}
