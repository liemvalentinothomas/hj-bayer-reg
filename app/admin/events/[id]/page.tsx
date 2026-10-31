import {notFound} from 'next/navigation';
import {requireAdmin} from '@/lib/admin';
import {uuid} from '@/lib/admin-input';
import AdminShell from '@/components/AdminShell';
import AdminNotice from '@/components/AdminNotice';
import EventSettings from '@/components/EventSettings';
export const dynamic='force-dynamic';
export default async function EventAdmin({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{message?:string;error?:string}>}){
 const {client}=await requireAdmin(),{id}=await params,notice=await searchParams;
 if(id==='new')return <AdminShell><a href="/admin">← Daftar acara</a><h1>Buat acara</h1><AdminNotice {...notice}/><EventSettings/></AdminShell>;
 if(!uuid(id))notFound();const {data:e,error}=await client.from('events').select('*').eq('id',id).maybeSingle();
 if(error)return <AdminShell><p role="alert">Acara belum dapat dimuat.</p></AdminShell>;if(!e)notFound();
 return <AdminShell><a href="/admin">← Daftar acara</a><p className="eyebrow">PENGATURAN ACARA</p><h1>{e.name}</h1><span className="tag">{e.status==='draft'?'Draf':e.status==='archived'?'Diarsipkan':e.status==='closed'?'Ditutup':'Dibuka'}</span><AdminNotice {...notice}/><div className="tabs"><a href={'/admin/events/'+id+'/form'}>Editor form →</a><a href={'/admin/events/'+id+'/preview'}>Pratinjau peserta →</a></div><EventSettings event={e}/><section className="card"><h2>Status acara</h2><p>Pendaftaran peserta belum diaktifkan pada tahap pembangunan ini.</p>{e.status!=='archived'&&<form action="/admin/actions" method="post"><input type="hidden" name="action" value="event.archive"/><input type="hidden" name="id" value={id}/><button>Arsipkan acara</button><p className="muted">Data tetap tersimpan; acara tidak tampil di halaman publik.</p></form>}{e.status==='archived'&&<form action="/admin/actions" method="post"><input type="hidden" name="action" value="event.restore"/><input type="hidden" name="id" value={id}/><button>Kembalikan sebagai draf</button></form>}</section></AdminShell>;
}
