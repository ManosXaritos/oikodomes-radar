// Who is logged in, and their profile (plan, areas, products).
import { createClient } from './supabase/server.js';
import { adminClient } from './supabase/admin.js';

export async function getSession() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  const user = data && data.user;
  if (!user) return { user: null, profile: null };
  const { data: profile } = await adminClient().from('profiles').select('*').eq('id', user.id).maybeSingle();
  return { user, profile: profile || { id: user.id, email: user.email, units: [], regions: [], products: [] } };
}
