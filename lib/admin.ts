import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';
export async function requireAdmin() {
  const client = await supabaseServer();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) redirect('/login');
  const membership = await client.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
  if (membership.error || !membership.data) redirect('/login?error=forbidden');
  return {client,user};
}
