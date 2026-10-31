'use server';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
export async function login(form: FormData) {
  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');
  if (!email || !password || email.length>254 || password.length>1024) redirect('/login?error=invalid');
  const client = await supabaseServer();
  const { data, error } = await client.auth.signInWithPassword({email,password});
  if (error || !data.user) redirect('/login?error=invalid');
  const membership = await client.from('admin_users').select('user_id').eq('user_id',data.user.id).maybeSingle();
  if (membership.error || !membership.data) {
    await client.auth.signOut();
    redirect('/login?error=forbidden');
  }
  redirect('/admin');
}
export async function logout() {
  const client=await supabaseServer();
  await client.auth.signOut();
  redirect('/login');
}
