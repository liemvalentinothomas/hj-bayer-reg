import type {SupabaseClient} from '@supabase/supabase-js';
export async function organizationOptions(client:SupabaseClient,includeInactive=false){
 let p=client.from('organization_pd').select('id,name,active').order('name');if(!includeInactive)p=p.eq('active',true);const pd=await p;if(pd.error)throw new Error('Daftar PD belum dapat dimuat.');
 const pcs:{id:string;name:string;pd_id:string;active:boolean}[]=[];
 for(let offset=0;;offset+=500){let q=client.from('organization_pc').select('id,name,pd_id,active').order('id').range(offset,offset+499);if(!includeInactive)q=q.eq('active',true);const r=await q;if(r.error)throw new Error('Daftar PC belum dapat dimuat.');pcs.push(...r.data);if(r.data.length<500)break;}
 return pd.data.map(p=>({id:p.id,name:p.name,pcs:pcs.filter(c=>c.pd_id===p.id).map(c=>({id:c.id,name:c.name}))}));
}
