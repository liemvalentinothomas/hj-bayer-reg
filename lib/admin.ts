import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';
export async function adminSession(){
 const client=await supabaseServer();
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user)return null;
 const membership=await client.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
 if(membership.error||!membership.data)return null;
 return {client,user};
}
export async function requireAdmin(){const session=await adminSession();if(!session)redirect('/login');return session;}
