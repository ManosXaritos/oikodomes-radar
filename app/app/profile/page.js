import { redirect } from 'next/navigation';
import { getSession } from '../../../lib/session';
import { adminClient } from '../../../lib/supabase/admin';
import { hasAccess } from '../../../lib/plans';
import { photoUrl, slugify } from '../../../lib/profile';
import { siteUrl } from '../../../lib/stripe';
import ProfileEditor from './ProfileEditor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Το προφίλ μου · Radar' };

export default async function ProfilePage() {
  const { user, profile } = await getSession();
  if (!user) redirect('/login?next=/app/profile');
  const db = adminClient();
  const [{ data: bp }, { data: works }, { data: quotes }] = await Promise.all([
    db.from('business_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    db.from('profile_works').select('id,title,place,year,category,photo_path,via_radar').eq('user_id', user.id).order('sort').order('created_at'),
    db.from('quote_requests').select('id,name,phone,email,project,area,message,created_at').eq('profile_user_id', user.id).order('created_at', { ascending: false }).limit(50),
  ]);
  const name = bp?.name || profile.business_name || '';
  const initial = bp || {
    slug: slugify(name),
    name,
    headline: '',
    about: '',
    trades: profile.products || [],
    areas: '',
    since_year: null,
    phone: '',
    public_email: profile.email || user.email || '',
    website: '',
    address: '',
    tags: [],
    published: false,
  };
  return (
    <ProfileEditor
      initial={initial}
      saved={!!bp}
      active={hasAccess(profile)}
      site={siteUrl()}
      works={(works || []).map((w) => ({ ...w, photo: photoUrl(w.photo_path) }))}
      quotes={quotes || []}
    />
  );
}
