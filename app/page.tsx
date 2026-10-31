import Brand from '@/components/Brand';
import { configured, supabaseServer } from '@/lib/supabase/server';
export const dynamic='force-dynamic';
export default async function Home(){
 let events:{id:string;slug:string;name:string;status:string}[]=[];let failed=false;
 if(configured()){const client=await supabaseServer();const {data,error}=await client.from('events').select('id,slug,name,status').in('status',['open','closed']).order('created_at',{ascending:false});events=data||[];failed=!!error;}
 return <><Brand/><main className="narrow"><p className="eyebrow">HEXPHARM JAYA</p><h1>Temukan acara Anda.</h1><p className="muted">Informasi acara dan pendaftaran peserta.</p>{failed?<p role="alert" className="notice">Informasi acara belum dapat dimuat. Silakan coba kembali.</p>:events.length?events.map(e=><article className="card" key={e.id}><h2>{e.name}</h2><a href={'/events/'+e.slug}>Lihat acara →</a></article>):<div className="card"><h2>Belum ada acara yang diterbitkan.</h2><p>Informasi acara akan tersedia setelah diterbitkan oleh panitia.</p></div>}<a href="/login">Masuk sebagai admin</a></main></>;
}
