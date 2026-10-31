export const MANUAL='__manual__';
export type Organization={id:string;name:string;pcs:{id:string;name:string}[]};
export type OrganizationAnswer={pdId:string;pcId:string;pdManual:string;pcManual:string;ranting:string};
export function changePd(value:OrganizationAnswer,pdId:string):OrganizationAnswer{return {...value,pdId,pcId:'',pdManual:'',pcManual:''};}
const clean=(s:string)=>s.trim().replace(/\s+/g,' ');
export function resolveOrganization(value:OrganizationAnswer,options:Organization[]){
 const pd=options.find(p=>p.id===value.pdId),manualPd=value.pdId===MANUAL;
 if(!manualPd&&!pd)throw new Error('Pilih PD yang tersedia atau isi secara manual.');
 const pc=pd?.pcs.find(p=>p.id===value.pcId),manualPc=manualPd||value.pcId===MANUAL;
 if(!manualPc&&!pc)throw new Error('Pilih PC sesuai PD atau isi secara manual.');
 const pdName=manualPd?clean(value.pdManual):pd!.name,pcName=manualPc?clean(value.pcManual):pc!.name;
 if(!pdName||!pcName||pdName.length>200||pcName.length>200)throw new Error('Nama PD dan PC wajib diisi, maksimal 200 karakter.');
 return {pd_id:manualPd?null:pd!.id,pc_id:manualPc?null:pc!.id,pd_name_snapshot:pdName,pc_name_snapshot:pcName,pd_source:manualPd?'manual':'master',pc_source:manualPc?'manual':'master',ranting:clean(value.ranting)};
}
