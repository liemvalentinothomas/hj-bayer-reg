'use server';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
export async function logout() {
  const client=await supabaseServer();
  await client.auth.signOut();
  redirect('/login');
}
