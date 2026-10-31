import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
export const maxDuration=30;
export async function POST(request:NextRequest){
 const base=new URL(request.url);
 base.host=request.headers.get('host')||base.host;
 const response=NextResponse.redirect(new URL('/admin',base),303);
 response.headers.set('Cache-Control','private, no-store');
 const fail=(code:string)=>{
   response.cookies.getAll().forEach(c=>response.cookies.set(c.name,'',{path:'/',maxAge:0}));
   response.headers.set('Location',new URL('/login?error='+code,base).toString());
   return response;
 };
 const origin=request.headers.get('origin');
 if(origin&&origin!==base.origin)return fail('origin');
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return fail('config');
 try{
   const form=await request.formData();
   const email=String(form.get('email')||'').trim(),password=String(form.get('password')||'');
   if(!email||!password||email.length>254||password.length>1024)return fail('invalid');
   const deadline=AbortSignal.timeout(15000);
   const client=createServerClient(url,key,{
     global:{fetch:(input,init)=>fetch(input,{...init,signal:init?.signal?AbortSignal.any([init.signal,deadline]):deadline})},
     cookies:{getAll:()=>request.cookies.getAll(),setAll:items=>items.forEach(({name,value,options})=>{
       request.cookies.set(name,value);response.cookies.set(name,value,options);
     })},
   });
   const {data,error}=await client.auth.signInWithPassword({email,password});
   if(error){
     if(error.status===429)return fail('rate');
     if(error.status===401)return fail('config');
     if(error.status===undefined||error.status===0||error.status>=500)return fail('network');
     return fail('invalid');
   }
   if(!data.user)return fail('invalid');
   const membership=await client.from('admin_users').select('user_id').eq('user_id',data.user.id).maybeSingle();
   if(membership.error)return fail('access');
   if(!membership.data)return fail('forbidden');
   return response;
 }catch{return fail('network');}
}
