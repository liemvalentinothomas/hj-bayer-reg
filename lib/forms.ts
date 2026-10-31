export type QuestionType='text'|'textarea'|'radio'|'checkbox'|'select'|'number'|'date'|'phone'|'email'|'pd'|'pc'|'ranting';
export type Question={id:string;label:string;type:QuestionType;required:boolean;sectionId:string;help:string;options:string[];condition?:{questionId:string;equals:string}};
export type FormDefinition={schemaVersion:1;sections:{id:string;title:string}[];questions:Question[]};
export const SYSTEM=['nama','hp','pd','pc','ranting'];
export function initialForm():FormDefinition{
 const q=(id:string,label:string,type:QuestionType,sectionId:string,required=true,options:string[]=[],condition?:Question['condition'],help=''):Question=>({id,label,type,sectionId,required,options,help,...(condition?{condition}:{})});
 return {schemaVersion:1,sections:[{id:'identity',title:'Identitas'},{id:'organization',title:'Organisasi IBI'},{id:'practice',title:'Tempat praktik'}],questions:[q('nama','Nama lengkap beserta gelar','text','identity'),q('hp','Nomor HP','phone','identity'),q('email','Email','email','identity',false),q('pengurus','Apakah Anda pengurus IBI?','select','organization',true,['Tidak','Ya']),q('pd','PD / provinsi','pd','organization'),q('pc','PC / kabupaten / kota','pc','organization'),q('ranting','Ranting','ranting','organization'),q('tingkat','Tingkat kepengurusan','select','organization',true,['PD','PC','Ranting'],{questionId:'pengurus',equals:'Ya'}),q('jabatan','Jabatan kepengurusan','textarea','organization',true,[],{questionId:'pengurus',equals:'Ya'},'Jika memiliki beberapa jabatan, tulis satu jabatan per baris beserta tingkat kepengurusannya.'),q('praktik','Instansi / tempat praktik','text','practice'),q('delima','Status Bidan Delima','select','practice',true,['Ya','Tidak','Sedang dalam proses'])]};
}
const types=new Set(['text','textarea','radio','checkbox','select','number','date','phone','email','pd','pc','ranting']);
const idOk=(s:unknown):s is string=>typeof s==='string'&&/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(s);
export function validateDefinition(raw:unknown):FormDefinition{
 if(!raw||typeof raw!=='object')throw new Error('Definisi form tidak valid.');const d=raw as FormDefinition;
 if(d.schemaVersion!==1||!Array.isArray(d.sections)||!Array.isArray(d.questions)||d.sections.length<1||d.sections.length>30||d.questions.length>100)throw new Error('Form harus memiliki 1–30 bagian dan maksimal 100 pertanyaan.');
 const sections=new Set<string>(),ids=new Set<string>();for(const s of d.sections){if(!idOk(s.id)||sections.has(s.id)||typeof s.title!=='string'||!s.title.trim()||s.title.length>160)throw new Error('Bagian form tidak valid atau ID berulang.');sections.add(s.id);}
 const core:Record<string,string>={nama:'text',hp:'phone',pd:'pd',pc:'pc',ranting:'ranting'};
 for(const q of d.questions){
 if(!idOk(q.id)||ids.has(q.id)||!sections.has(q.sectionId)||typeof q.label!=='string'||!q.label.trim()||q.label.length>250||!types.has(q.type)||typeof q.required!=='boolean'||typeof q.help!=='string'||q.help.length>1000||!Array.isArray(q.options)||q.options.length>50||q.options.some(o=>typeof o!=='string'||!o.trim()||o.length>200))throw new Error('Pertanyaan tidak valid atau ID berulang.');
 if(core[q.id]&&q.type!==core[q.id])throw new Error('Tipe field sistem tidak dapat diubah.');if(!core[q.id]&&['pd','pc','ranting','phone'].includes(q.type))throw new Error('Komponen sistem tidak boleh diduplikasi.');
 if(['select','radio','checkbox'].includes(q.type)&&(!q.options.length||new Set(q.options).size!==q.options.length))throw new Error('Pilihan jawaban harus terisi dan tidak duplikat.');
 if(q.condition&&(!ids.has(q.condition.questionId)||typeof q.condition.equals!=='string'||q.condition.equals.length>200))throw new Error('Aturan tampil harus mengacu pada pertanyaan sebelumnya.');
 if(SYSTEM.includes(q.id)&&q.condition)throw new Error('Field sistem selalu ditampilkan.');if(['nama','hp','pd','pc'].includes(q.id)&&!q.required)throw new Error('Nama, HP, PD dan PC wajib diisi.');ids.add(q.id);
 }
 if(SYSTEM.some(id=>!ids.has(id)))throw new Error('Field sistem nama, HP, PD, PC dan ranting harus tersedia.');const p=d.questions.findIndex(q=>q.id==='pd');if(d.questions[p+1]?.id!=='pc'||d.questions[p+2]?.id!=='ranting'||d.questions[p].sectionId!==d.questions[p+1].sectionId||d.questions[p].sectionId!==d.questions[p+2].sectionId)throw new Error('PD, PC dan ranting harus berurutan dalam bagian yang sama.');return structuredClone(d);
}
export function readDefinition(raw:unknown):FormDefinition{try{return validateDefinition(raw);}catch{return initialForm();}}
