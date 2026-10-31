import { requireAdmin } from '@/lib/admin';
import AdminShell from '@/components/AdminShell';
import AdminNotice from '@/components/AdminNotice';
export const dynamic='force-dynamic';
export default async function Admin({searchParams}:{searchParams:Promise<{message?:string;error?:string}>}){
 const {client}=await requireAdmin(),params=await searchParams;
 const {data,error}=await client.from('events').select('id,slug,name,status,capacity,created_at').order('created_at',{ascending:false});
 return <AdminShell><p className="eyebrow">ACARA</p><h1>Daftar acara</h1><p className="muted">Kelola informasi dan draf form setiap acara.</p><AdminNotice {...params}/><a className="button primary-inline" href="/admin/events/new">+ Buat acara</a>{error?<p role="alert">Daftar acara belum dapat dimuat.</p>:data?.length?data.map(e=><article className="card" key={e.id}><span className="tag">{({draft:'Draf',open:'Dibuka',closed:'Ditutup',archived:'Diarsipkan'} as Record<string,string>)[e.status]||e.status}</span><h2>{e.name}</h2><p className="muted">Kuota: {e.capacity??'Tidak dibatasi'}</p><a href={'/admin/events/'+e.id}>Kelola acara →</a></article>):<p>Belum ada acara.</p>}</AdminShell>;
}
