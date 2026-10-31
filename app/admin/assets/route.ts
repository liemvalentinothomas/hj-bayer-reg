import {NextRequest,NextResponse} from 'next/server';
import {validateImage} from '@/lib/image-validation';
import {adminSession} from '@/lib/admin';
import {uuid} from '@/lib/admin-input';
export const maxDuration=60;
export async function POST(request:NextRequest){
 const session=await adminSession();if(!session)return NextResponse.json({error:'Login admin diperlukan.'},{status:401});const base=new URL(request.url);base.host=request.headers.get('host')||base.host;if(request.headers.get('origin')!==base.origin)return NextResponse.json({error:'Permintaan tidak valid.'},{status:403});
 const fail=(error:string,status=400)=>NextResponse.json({error},{status});
 try{const text=await request.text();if(text.length>2000)return fail('Permintaan tidak valid.');const b=JSON.parse(text);if(!['banner','event_logo','company_logo'].includes(b.kind)||(b.kind!=='company_logo'&&!uuid(b.eventId)))return fail('Jenis gambar tidak valid.');const prefix=b.kind==='company_logo'?'company/':`events/${b.eventId}/`;
 if(b.path!==null){if(typeof b.path!=='string'||!b.path.startsWith(prefix+b.kind+'/')||!new RegExp('^'+prefix.replaceAll('/','\\/')+b.kind+'/[a-f0-9-]+\\.(png|jpg|webp)$').test(b.path))return fail('Lokasi gambar tidak valid.');const f=await session.client.storage.from('registration-assets').download(b.path);if(f.error||!f.data)return fail('Gambar belum dapat dibaca.');if(f.data.size>(b.kind==='banner'?8:2)*1024*1024)return fail('Ukuran gambar melebihi batas.');const bytes=Buffer.from(await f.data.arrayBuffer());await validateImage(bytes,b.kind==='banner'?'banner':'logo');}
 const r=b.kind==='company_logo'?await session.client.from('app_settings').upsert({singleton:true,company_logo_path:b.path},{onConflict:'singleton'}):await session.client.from('events').update({[b.kind==='banner'?'banner_path':'event_logo_path']:b.path}).eq('id',b.eventId).select('id').single();if(r.error)return fail('Pengaturan gambar gagal disimpan.',503);return NextResponse.json({ok:true});
 }catch{return fail('Gambar tidak valid atau koneksi terputus.');}
}
