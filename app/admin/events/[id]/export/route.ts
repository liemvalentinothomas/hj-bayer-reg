import {NextRequest,NextResponse} from 'next/server';
import {adminSession} from '@/lib/admin';
import {uuid} from '@/lib/admin-input';
import {participantQuery,csvCell} from '@/lib/participants';
export const maxDuration=60;
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const s=await adminSession();if(!s)return NextResponse.json({error:'Akses admin diperlukan.'},{status:401});const {id}=await params;if(!uuid(id))return new Response('Acara tidak valid.',{status:400});
 const e=await s.client.from('events').select('name').eq('id',id).single();if(e.error)return new Response('Acara tidak ditemukan.',{status:404});
 const f=Object.fromEntries(request.nextUrl.searchParams),cutoff=new Date().toISOString();const rows:Record<string,any>[]=[];
 for(let offset=0;;offset+=500){const r=await participantQuery(s.client,id,f,cutoff).range(offset,offset+499);if(r.error)return new Response('Ekspor gagal. Silakan coba kembali.',{status:503});rows.push(...r.data);if(r.data.length<500)break;}
 const versions=new Map<string,{version:number;definition:any}>();const ids=[...new Set(rows.map(r=>r.form_version_id))];for(let i=0;i<ids.length;i+=100){const r=await s.client.from('form_versions').select('id,version,definition').eq('event_id',id).in('id',ids.slice(i,i+100));if(r.error)return new Response('Versi jawaban gagal dimuat.',{status:503});r.data.forEach(v=>versions.set(v.id,v));}
 const columns=new Map<string,{versionId:string;id:string;label:string}>();for(const row of rows){const v=versions.get(row.form_version_id);for(const [qid] of Object.entries(row.answers||{})){if(qid.startsWith('_'))continue;const key=row.form_version_id+':'+qid;if(!columns.has(key)){const q=v?.definition?.questions?.find((q:any)=>q.id===qid);columns.set(key,{versionId:row.form_version_id,id:qid,label:`${q?.label||qid} [${qid} / v${v?.version||'?'}]`});}}}
 const extra=[...columns.values()];const header=['ID acara','Nama acara','Nomor registrasi','Nama lengkap','HP','Email','PD','PC','Ranting','Waktu daftar (UTC)',...extra.map(c=>c.label)];const lines=[header.map(csvCell).join(',')];for(const row of rows)lines.push([id,e.data.name,row.registration_number,row.full_name,row.phone_normalized,row.email,row.pd_name_snapshot,row.pc_name_snapshot,row.ranting,row.created_at,...extra.map(c=>c.versionId===row.form_version_id?row.answers?.[c.id]:'')].map(csvCell).join(','));
 return new Response('\uFEFF'+lines.join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="peserta-${id}.csv"`,'Cache-Control':'private, no-store'}});
}
