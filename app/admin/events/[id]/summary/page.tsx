import {notFound} from 'next/navigation';
import {requireAdmin} from '@/lib/admin';
import {uuid} from '@/lib/admin-input';
import AdminShell from '@/components/AdminShell';
export const dynamic='force-dynamic';
export default async function Summary({params}:{params:Promise<{id:string}>}){
 const {client}=await requireAdmin(),{id}=await params;if(!uuid(id))notFound();const e=await client.from('events').select('name').eq('id',id).maybeSingle();if(!e.data)notFound();const r=await client.rpc('hj_event_summary',{p_event:id}),d=r.data;
 const table=(rows:{name:string;total:number}[])=>rows?.length?<table><thead><tr><th>Organisasi</th><th>Peserta</th></tr></thead><tbody>{rows.map((x,i)=><tr key={i}><td>{x.name}</td><td>{x.total}</td></tr>)}</tbody></table>:<p>Belum ada data.</p>;
 return <AdminShell><a href={'/admin/events/'+id}>← Pengaturan acara</a><h1>Ringkasan peserta</h1><p>{e.data.name}</p>{r.error?<p role="alert">Ringkasan belum dapat dimuat. Periksa aktivasi database.</p>:<><div className="grid">{[['Peserta terdaftar',d.total],['Pengurus IBI',d.pengurus],['Bidan Delima',d.delima],['Bidan Delima dalam proses',d.delima_process]].map(([label,value])=><div className="card" key={label}><p className="muted">{label}</p><h2>{value}</h2></div>)}</div><p className="muted">Kategori mengikuti jawaban pertanyaan pengurus dan Bidan Delima bila digunakan.</p><div className="grid"><section className="card"><h2>PD (20 teratas)</h2>{table(d.pd)}</section><section className="card"><h2>PC (20 teratas)</h2>{table(d.pc)}</section></div><section className="card"><h2>Nama dan PC yang sama</h2><p>Daftar untuk ditinjau manual; bukan penolakan otomatis.</p>{d.duplicates?.length?<ul>{d.duplicates.map((x:any,i:number)=><li key={i}>{x.name} · {x.pc} · {x.total} peserta</li>)}</ul>:<p>Tidak ada nama dan PC yang sama.</p>}</section></>}</AdminShell>;
}
