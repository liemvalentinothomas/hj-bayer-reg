import {NextRequest,NextResponse} from 'next/server';
import {adminSession} from '@/lib/admin';
import {uuid} from '@/lib/admin-input';
export async function POST(request:NextRequest){
 const session=await adminSession();if(!session)return NextResponse.json({error:'Login admin diperlukan.'},{status:401});
 const base=new URL(request.url);base.host=request.headers.get('host')||base.host;if(request.headers.get('origin')!==base.origin)return NextResponse.json({error:'Permintaan tidak valid.'},{status:403});
 try{const text=await request.text();if(text.length>150000)throw new Error();const b=JSON.parse(text);if(!uuid(b.id)||typeof b.reason!=='string'||b.reason.trim().length<3||b.reason.length>2000)return NextResponse.json({error:'Alasan koreksi wajib diisi.'},{status:400});
 const r=await session.client.rpc('hj_correct_registration',{p_id:b.id,p_payload:b.payload,p_reason:b.reason});if(r.error)return NextResponse.json({error:r.error.code==='23505'?'Nomor HP sudah dipakai peserta lain.':r.error.code==='P0001'?r.error.message:'Koreksi belum dapat disimpan.'},{status:409});return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:'Data koreksi tidak valid.'},{status:400});}
}
