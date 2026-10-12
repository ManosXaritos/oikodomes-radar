// Make the public profile page show changes right away. Server-only.
import { revalidatePath } from 'next/cache';
import { adminClient } from './supabase/admin.js';

export async function refreshProfile(userId, ...extraSlugs) {
  try {
    const { data } = await adminClient().from('business_profiles').select('slug').eq('user_id', userId).maybeSingle();
    for (const slug of new Set([data?.slug, ...extraSlugs].filter(Boolean))) revalidatePath(`/m/${slug}`);
  } catch {}
}
