import EventEntry from '@/components/EventEntry';
import {notFound} from 'next/navigation';
import Brand from '@/components/Brand';
import {configured,supabaseServer} from '@/lib/supabase/server';
import {assetUrl} from '@/lib/assets';
export const dynamic='force-dynamic';
export default async function EventPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;if(!configured())notFound();const c=await supabaseServer();const {data:e,error}=await c.from('events').select('name,description,location,starts_at,status,color,banner_path,banner_position_x,banner_position_y,event_logo_path,registration_opens_at,registration_closes_at').eq('slug',slug).in('status',['open','closed']).maybeSingle();
 if(error)return <><Brand/><main><p role="alert">Informasi acara belum dapat dimuat.</p></main></>;if(!e)notFound();const banner=await assetUrl(c,e.banner_path);const now=Date.now(),open=e.status==='open'&&(!e.registration_opens_at||new Date(e.registration_opens_at).getTime()<=now)&&(!e.registration_closes_at||new Date(e.registration_closes_at).getTime()>now);
 return <><EventEntry slug={slug}/><Brand eventName={e.name} eventLogoPath={e.event_logo_path}/><main className="narrow" style={{'--brand':e.color} as React.CSSProperties}>{banner&&<img className="event-banner" src={banner} alt={'Banner '+e.name} style={{objectPosition:`${e.banner_position_x}% ${e.banner_position_y}%`}}/>}<p className="eyebrow">PENDAFTARAN PESERTA · GRATIS</p><h1>{e.name}</h1><div className="card"><p>{e.starts_at?new Intl.DateTimeFormat('id-ID',{dateStyle:'long',timeStyle:'short',timeZone:'Asia/Jakarta'}).format(new Date(e.starts_at))+' WIB':'Tanggal akan diumumkan'}</p><p>{e.location||'Lokasi akan diumumkan'}</p></div><p className="description">{e.description}</p>{!open&&<p className="notice">Pendaftaran belum dibuka atau periode pendaftaran telah ditutup.</p>}<a className="button primary-inline" href={'/events/'+slug+'/register'}>{open?'Daftar sekarang →':'Lihat form / bukti registrasi →'}</a></main></>;
}
