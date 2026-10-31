import type {SupabaseClient} from '@supabase/supabase-js';
export const participantColumns='id,event_id,form_version_id,registration_number,full_name,phone_normalized,email,pd_id,pc_id,pd_name_snapshot,pc_name_snapshot,ranting,answers,created_at';
export type ParticipantFilters={q?:string;pd?:string;pc?:string;pengurus?:string;delima?:string};
export function participantQuery(c:SupabaseClient,eventId:string,f:ParticipantFilters,cutoff?:string){
 let q=c.from('registrations').select(participantColumns,{count:'exact'}).eq('event_id',eventId).order('created_at',{ascending:false}).order('id');
 const search=(f.q||'').slice(0,80).replace(/[^\p{L}\p{N} +@_.-]/gu,' ').trim();if(search)q=q.or(`full_name.ilike.%${search}%,phone_normalized.ilike.%${search}%`);
 if(f.pd)q=q.eq('pd_name_snapshot',f.pd.slice(0,200));if(f.pc)q=q.eq('pc_name_snapshot',f.pc.slice(0,200));if(f.pengurus)q=q.eq('answers->>pengurus',f.pengurus);if(f.delima)q=q.eq('answers->>delima',f.delima);if(cutoff)q=q.lte('created_at',cutoff);return q;
}
export function csvCell(value:unknown){const s=value==null?'':Array.isArray(value)?value.map(v=>typeof v==='object'?JSON.stringify(v):String(v)).join('; '):typeof value==='object'?JSON.stringify(value):String(value);const safe=/^[\s\u0000-\u001f]*[=+@-]|^[\t\r\n]/.test(s)?"'"+s:s;return '"'+safe.replaceAll('"','""')+'"';}
