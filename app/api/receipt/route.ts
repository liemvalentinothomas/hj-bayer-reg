import {NextRequest,NextResponse} from 'next/server';
import {publicClient} from '@/lib/public-client';
import {uuid} from '@/lib/admin-input';
export async function POST(request:NextRequest){
 const reply=(b:object,status=200)=>NextResponse.json(b,{status,headers:{'Cache-Control':'no-store'}});
 try{const text=await request.text();if(text.length>1000)return reply({error:'Permintaan tidak valid.'},400);const b=JSON.parse(text);
 if(typeof b.slug!=='string'||b.slug.length>120||typeof b.token!=='string'||!/^[a-f0-9]{64}$/.test(b.token)||!(uuid(b.id)||uuid(b.request))||(b.id&&b.request))return reply({error:'Permintaan tidak valid.'},400);
 const r=await publicClient().rpc('hj_registration_receipt',{p_slug:b.slug,p_id:b.id||null,p_request:b.request||null,p_token:b.token});if(r.error)return reply({error:'Bukti belum dapat dimuat. Coba kembali.'},503);return reply({receipt:r.data||null});
 }catch{return reply({error:'Bukti belum dapat dimuat. Coba kembali.'},503);}
}
