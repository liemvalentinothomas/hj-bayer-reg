import Brand from '@/components/Brand';
import { requireAdmin } from '@/lib/admin';
import { configured } from '@/lib/supabase/server';
import { logout } from '@/app/login/actions';
export const dynamic='force-dynamic';
export default async function Admin(){
 if(!configured())return <><Brand/><main><h1>Konfigurasi belum tersedia</h1><p>Isi environment Supabase untuk mengaktifkan login admin.</p></main></>;
 const {client,user}=await requireAdmin();
 const {data,error}=await client.from('events').select('id,slug,name,status,capacity,created_at').order('created_at',{ascending:false});
 return <><Brand/><main><div className="toprow"><div><p className="eyebrow">RUANG KERJA</p><h1>Daftar acara</h1><p className="muted">{user.email}</p></div><form action={logout}><button>Keluar</button></form></div><p className="notice">Tahap integrasi awal: login dan daftar acara. Pengelolaan form, peserta, aset, dan ekspor belum diaktifkan.</p>{error?<p role="alert">Daftar acara belum dapat dimuat. Periksa hak akses database.</p>:data?.length?data.map(e=><article className="card" key={e.id}><span className="tag">{({draft:'Draf',open:'Dibuka',closed:'Ditutup',archived:'Diarsipkan'} as Record<string,string>)[e.status]||e.status}</span><h2>{e.name}</h2><p className="muted">Kuota: {e.capacity??'Tidak dibatasi'}</p>{['open','closed'].includes(e.status)&&<a href={'/events/'+e.slug}>Lihat halaman publik →</a>}</article>):<p>Belum ada acara.</p>}</main></>;
}
