import {NextRequest,NextResponse} from 'next/server';
import {adminSession} from '@/lib/admin';
import {clean,eventInput,uuid} from '@/lib/admin-input';
import {validateDefinition} from '@/lib/forms';
import source from '@/data/organization-options.json';
export const maxDuration=60;
export async function POST(request:NextRequest){
 const base=new URL(request.url);base.host=request.headers.get('host')||base.host;
 const session=await adminSession();if(!session)return NextResponse.redirect(new URL('/login',base),303);
 const {client}=session;
 const go=(path:string,key:string,message:string)=>{const u=new URL(path,base);u.searchParams.set(key,message);const r=NextResponse.redirect(u,303);r.headers.set('Cache-Control','private, no-store');return r;};
 if(request.headers.get('origin')!==base.origin)return go('/admin','error','Permintaan tidak valid. Muat ulang halaman dan coba kembali.');
 let dest='/admin';
 // Never expose raw database errors (they can include user input or internal details).
 const dbError=(e:{code?:string}|null)=>{if(e)throw new Error(e.code==='23505'?'Nama, slug, atau versi tersebut sudah digunakan. Muat ulang dan coba kembali.':'Perubahan belum dapat disimpan. Periksa koneksi dan hak akses database.');};
 try{
 const form=await request.formData(),action=String(form.get('action')||''),id=String(form.get('id')||'');
 if(action.startsWith('org.'))dest='/admin/organizations';else if(uuid(id))dest='/admin/events/'+id;
 if(action==='event.publish'){
  if(!uuid(id)||!uuid(form.get('version')))throw new Error('Simpan dan tinjau revisi form terlebih dahulu.');
  const r=await client.rpc('hj_publish_event',{p_event:id,p_version:String(form.get('version'))});if(r.error)throw new Error(r.error.code==='P0001'?r.error.message:'Publikasi belum tersedia. Jalankan migration fitur lengkap terlebih dahulu.');return go(dest,'message','Form diterbitkan dan pendaftaran dibuka sesuai periode acara.');
 }
 if(action==='event.close'){
  if(!uuid(id))throw new Error('Acara tidak valid.');const r=await client.from('events').update({status:'closed'}).eq('id',id).select('id').single();dbError(r.error);return go(dest,'message','Pendaftaran ditutup. Bukti peserta tetap tersedia.');
 }
 if(action==='event.copy'){
  if(!uuid(id))throw new Error('Acara tidak valid.');const name=clean(form.get('name')),slug=clean(form.get('slug'),120);if(!name||!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))throw new Error('Isi nama dan slug salinan yang valid.');const r=await client.rpc('hj_copy_event',{p_event:id,p_name:name,p_slug:slug});if(r.error)throw new Error(r.error.code==='23505'?'Slug salinan sudah dipakai.':'Acara belum dapat disalin. Periksa aktivasi fitur database.');return go('/admin/events/'+r.data,'message','Acara disalin sebagai draf, tanpa peserta lama.');
 }
 if(action==='event.crop'){
  if(!uuid(id))throw new Error('Acara tidak valid.');const x=Number(form.get('x')),y=Number(form.get('y'));if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||x>100||y<0||y>100)throw new Error('Posisi potong tidak valid.');const r=await client.from('events').update({banner_position_x:x,banner_position_y:y}).eq('id',id).select('id').single();dbError(r.error);return go(dest,'message','Posisi potong banner tersimpan.');
 }
 if(action==='event.create'){
  dest='/admin/events/new';const payload=eventInput(form);const r=await client.from('events').insert({...payload,status:'draft'}).select('id').single();dbError(r.error);return go('/admin/events/'+r.data!.id,'message','Acara dibuat sebagai draf.');
 }
 if(action==='event.save'){
  if(!uuid(id))throw new Error('Acara tidak valid.');const r=await client.from('events').update(eventInput(form)).eq('id',id).select('id').single();dbError(r.error);return go(dest,'message','Informasi acara tersimpan.');
 }
 if(['event.archive','event.restore'].includes(action)){
  if(!uuid(id))throw new Error('Acara tidak valid.');const r=await client.from('events').update({status:action==='event.archive'?'archived':'draft'}).eq('id',id).select('id').single();dbError(r.error);return go(dest,'message',action==='event.archive'?'Acara diarsipkan. Data tetap tersimpan.':'Acara dikembalikan menjadi draf.');
 }
 if(action==='form.save'){
  if(!uuid(id))throw new Error('Acara tidak valid.');dest='/admin/events/'+id+'/form';
  const text=String(form.get('definition')||'');if(text.length>200000)throw new Error('Definisi form terlalu besar.');const definition=validateDefinition(JSON.parse(text));
  const event=await client.from('events').select('id').eq('id',id).single();dbError(event.error);
  const latest=await client.from('form_versions').select('id,version').eq('event_id',id).order('version',{ascending:false}).limit(1).maybeSingle();dbError(latest.error);
  const expected=String(form.get('base_version_id')||'');if((latest.data?.id||'')!==expected)throw new Error('Form sudah berubah pada tab lain. Muat ulang sebelum menyimpan revisi.');
  const r=await client.from('form_versions').insert({event_id:id,version:(latest.data?.version||0)+1,status:'draft',definition});dbError(r.error);return go(dest,'message','Revisi draf baru tersimpan. Form publik tidak berubah.');
 }
 if(action==='org.import'){
  // Import is additive and repeatable; never reactivate records disabled by the admin.
  let addedPd=0,addedPc=0;
  const allPd=await client.from('organization_pd').select('id,name,active');dbError(allPd.error);
  const normalized=(name:string)=>name.trim().toLowerCase();
  for(const item of source){
   const matches=(allPd.data||[]).filter(p=>normalized(p.name)===normalized(item.name));
   let pdData:{id:string;name:string;active:boolean}|null=matches.find(p=>p.active)||matches[0]||null;
   if(pdData&&!pdData.active)continue;
   if(!pdData){const r=await client.from('organization_pd').insert({name:item.name}).select('id,name,active').single();dbError(r.error);pdData=r.data;addedPd++;}
   const pdId=pdData!.id;const existing=await client.from('organization_pc').select('name').eq('pd_id',pdId);dbError(existing.error);const keys=new Set((existing.data||[]).map(p=>p.name.trim().toLowerCase()));
   const missing=item.pcs.filter(p=>!keys.has(p.name.trim().toLowerCase())).map(p=>({pd_id:pdId,name:p.name}));
   if(missing.length){const r=await client.from('organization_pc').insert(missing);dbError(r.error);addedPc+=missing.length;}
  }
  return go(dest,'message',`Impor selesai: ${addedPd} PD dan ${addedPc} PC ditambahkan. Data yang sudah tersedia dipertahankan.`);
 }
 if(action==='org.pd.add'||action==='org.pd.save'){
  const name=clean(form.get('name'),200);if(!name)throw new Error('Nama PD wajib diisi.');if(action.endsWith('save')&&!uuid(id))throw new Error('PD tidak valid.');const r=action.endsWith('add')?await client.from('organization_pd').insert({name}):await client.from('organization_pd').update({name}).eq('id',id).select('id').single();dbError(r.error);return go(dest,'message','PD tersimpan.');
 }
 if(action==='org.pc.add'||action==='org.pc.save'){
  const name=clean(form.get('name'),200),pdId=String(form.get('pd_id')||'');if(!name)throw new Error('Nama PC wajib diisi.');
  if(action.endsWith('add')){if(!uuid(pdId))throw new Error('Pilih PD induk.');const parent=await client.from('organization_pd').select('id').eq('id',pdId).eq('active',true).single();dbError(parent.error);const r=await client.from('organization_pc').insert({pd_id:pdId,name});dbError(r.error);}else{if(!uuid(id))throw new Error('PC tidak valid.');const r=await client.from('organization_pc').update({name}).eq('id',id).select('id').single();dbError(r.error);}
  return go(dest,'message','PC tersimpan.');
 }
 if(['org.pd.disable','org.pc.disable'].includes(action)){
  if(!uuid(id))throw new Error('Organisasi tidak valid.');
  if(action==='org.pd.disable'){const children=await client.from('organization_pc').select('id',{count:'exact',head:true}).eq('pd_id',id).eq('active',true);dbError(children.error);if(children.count)throw new Error('Nonaktifkan PC di bawah PD ini terlebih dahulu.');}
  const r=await client.from(action==='org.pd.disable'?'organization_pd':'organization_pc').update({active:false}).eq('id',id).select('id').single();dbError(r.error);return go(dest,'message','Organisasi dinonaktifkan dari pilihan. Riwayat tetap tersimpan.');
 }
 throw new Error('Tindakan tidak dikenali.');
 }catch(e){return go(dest,'error',e instanceof SyntaxError?'Definisi form tidak dapat dibaca.':e instanceof Error?e.message:'Perubahan gagal. Silakan coba kembali.');}
}
