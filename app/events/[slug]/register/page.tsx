import {notFound} from 'next/navigation';
import Brand from '@/components/Brand';
import RegistrationForm from '@/components/RegistrationForm';
import {supabaseServer} from '@/lib/supabase/server';
import {validateDefinition} from '@/lib/forms';
import {organizationOptions} from '@/lib/organizations';
export const dynamic='force-dynamic';
export default async function Register({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params,c=await supabaseServer();const r=await c.from('events').select('id,name,status,published_form_version_id,event_logo_path,registration_opens_at,registration_closes_at').eq('slug',slug).in('status',['open','closed']).maybeSingle();if(r.error)return <main><p role="alert">Acara belum dapat dimuat.</p></main>;if(!r.data)notFound();const e=r.data;
 const fv=await c.from('form_versions').select('id,definition').eq('id',e.published_form_version_id).eq('status','published').maybeSingle();
 let definition=null,options;try{definition=validateDefinition(fv.data?.definition);options=await organizationOptions(c);}catch{}
 return <><Brand eventName={e.name} eventLogoPath={e.event_logo_path}/><main className="narrow"><a href={'/events/'+slug}>← Halaman acara</a><h1>Pendaftaran peserta</h1><p>{e.name}</p>{definition&&options&&fv.data?<RegistrationForm slug={slug} version={fv.data.id} eventId={e.id} definition={definition} options={options} registrationOpen={e.status==='open'&&(!e.registration_opens_at||new Date(e.registration_opens_at).getTime()<=Date.now())&&(!e.registration_closes_at||new Date(e.registration_closes_at).getTime()>Date.now())}/>:<p className="notice" role="alert">Form belum tersedia. Silakan coba kembali.</p>}</main></>;
}
