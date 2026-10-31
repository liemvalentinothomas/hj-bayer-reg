import {notFound} from 'next/navigation';
import {requireAdmin} from '@/lib/admin';
import {uuid} from '@/lib/admin-input';
import {initialForm,validateDefinition} from '@/lib/forms';
import AdminShell from '@/components/AdminShell';
import AdminNotice from '@/components/AdminNotice';
import FormEditor from '@/components/FormEditor';
export const dynamic='force-dynamic';
export default async function Editor({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{message?:string;error?:string}>}){
 const {client}=await requireAdmin(),{id}=await params;if(!uuid(id))notFound();
 const e=await client.from('events').select('id,name').eq('id',id).maybeSingle();if(e.error)return <AdminShell><p role="alert">Acara gagal dimuat.</p></AdminShell>;if(!e.data)notFound();
 const latest=await client.from('form_versions').select('id,version,definition,status').eq('event_id',id).order('version',{ascending:false}).limit(1).maybeSingle();
 let definition=initialForm(),invalid=false;if(latest.data?.definition?.questions?.length){try{definition=validateDefinition(latest.data.definition);}catch{invalid=true;}}
 return <AdminShell><a href={'/admin/events/'+id}>← Pengaturan acara</a><p className="eyebrow">{e.data.name}</p><h1>Editor form</h1><AdminNotice {...await searchParams}/>{latest.error||invalid?<p role="alert">Definisi form belum dapat dibaca. Data lama tidak diubah.</p>:<><p className="notice">{latest.data?'Revisi '+latest.data.version+' · '+latest.data.status:'Template awal · belum disimpan'}. Penyimpanan membuat revisi draf baru; versi sebelumnya tetap tersimpan.</p><FormEditor eventId={id} definition={definition} baseVersionId={latest.data?.id||''}/></>}</AdminShell>;
}
