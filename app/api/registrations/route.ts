import {NextRequest,NextResponse} from 'next/server';
import {publicClient} from '@/lib/public-client';
import {uuid} from '@/lib/admin-input';
export const maxDuration=30;
export async function POST(request:NextRequest){
 const answer=(body:object,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
 try{
 if(Number(request.headers.get('content-length')||0)>150000)return answer({error:'Data terlalu besar.'},413);
 const text=await request.text();if(text.length>150000)return answer({error:'Data terlalu besar.'},413);const b=JSON.parse(text);
 if(b.website)return answer({error:'Permintaan tidak valid.'},400);
 if(typeof b.slug!=='string'||!/^([a-z0-9]+-)*[a-z0-9]+$/.test(b.slug)||b.slug.length>120||!uuid(b.version)||!uuid(b.request)||typeof b.token!=='string'||!/^[a-f0-9]{64}$/.test(b.token)||b.agree!==true)return answer({error:'Periksa data dan pernyataan konfirmasi.'},400);
 const client=publicClient();const r=await client.rpc('hj_submit_registration',{p_slug:b.slug,p_version:b.version,p_request:b.request,p_token:b.token,p_payload:b.payload});
 if(r.error)return answer({error:'Pendaftaran belum dapat diproses. Silakan coba kembali.'},503);
 if(!r.data?.ok)return answer({error:r.data?.error||'Pendaftaran gagal.'},409);
 return answer({receipt:r.data.receipt});
 }catch{return answer({error:'Koneksi pendaftaran terputus. Coba kirim kembali; pendaftaran ganda akan dicegah.'},503);}
}
