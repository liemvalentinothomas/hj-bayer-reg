import {notFound} from 'next/navigation';
import {requireAdmin} from '@/lib/admin';
import {uuid} from '@/lib/admin-input';
import {initialForm,validateDefinition} from '@/lib/forms';
import AdminShell from '@/components/AdminShell';
import FormPreview from '@/components/FormPreview';
export const dynamic='force-dynamic';
export default async function Preview({params}:{params:Promise<{id:string}>}){
 const {client}=await requireAdmin(),{id}=await params;if(!uuid(id))notFound();
 const e=await client.from('events').select('id,name').eq('id',id).maybeSingle();if(e.error)return <AdminShell><p role="alert">Acara gagal dimuat.</p></AdminShell>;if(!e.data)notFound();
 const [fv,pd,pc]=await Promise.all([client.from('form_versions').select('definition,version').eq('event_id',id).order('version',{ascending:false}).limit(1).maybeSingle(),client.from('organization_pd').select('id,name').eq('active',true).order('name'),client.from('organization_pc').select('id,pd_id,name').eq('active',true).order('name').limit(1000)]);
 let definition=initialForm(),invalid=false;if(fv.data?.definition?.questions?.length){try{definition=validateDefinition(fv.data.definition);}catch{invalid=true;}}
 const options=(pd.data||[]).map(p=>({...p,pcs:(pc.data||[]).filter(c=>c.pd_id===p.id)}));
 return <AdminShell><a href={'/admin/events/'+id+'/form'}>← Editor form</a><h1>{e.data.name}</h1><p className="notice">Pratinjau admin · {fv.data?'revisi '+fv.data.version:'template awal'}. Data peserta tidak disimpan.</p>{fv.error||pd.error||pc.error||invalid?<p role="alert">Pratinjau belum dapat dimuat.</p>:<FormPreview definition={definition} options={options}/>}</AdminShell>;
}
