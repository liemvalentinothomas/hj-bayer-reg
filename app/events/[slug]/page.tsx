import { notFound } from 'next/navigation';
import Brand from '@/components/Brand';
import { configured, supabaseServer } from '@/lib/supabase/server';
export const dynamic='force-dynamic';
export default async function EventPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;if(!configured())notFound();const client=await supabaseServer();
 const {data:e,error}=await client.from('events').select('name,description,location,starts_at,status,color').eq('slug',slug).in('status',['open','closed']).maybeSingle();
 if(error)return <><Brand/><main><p role="alert">Informasi acara belum dapat dimuat.</p></main></>;if(!e)notFound();
 return <><Brand/><main className="narrow" style={{'--brand':e.color} as React.CSSProperties}><p className="eyebrow">PENDAFTARAN PESERTA · GRATIS</p><h1>{e.name}</h1><div className="card"><p>{e.starts_at?new Intl.DateTimeFormat('id-ID',{dateStyle:'long',timeStyle:'short',timeZone:'Asia/Jakarta'}).format(new Date(e.starts_at))+' WIB':'Tanggal akan diumumkan'}</p><p>{e.location||'Lokasi akan diumumkan'}</p></div><p className="description">{e.description}</p><p className="notice">{e.status==='closed'?'Pendaftaran acara ditutup.':'Form pendaftaran belum tersedia pada versi aplikasi ini.'}</p></main></>;
}
