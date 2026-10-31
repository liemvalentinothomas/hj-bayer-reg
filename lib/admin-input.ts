export const clean=(v:FormDataEntryValue|null,max=250)=>{const s=String(v||'').trim().replace(/\s+/g,' ');if(s.length>max)throw new Error(`Isian terlalu panjang (maksimal ${max} karakter).`);return s;};
export const uuid=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
export function eventInput(form:FormData){
 const name=clean(form.get('name')),slug=clean(form.get('slug'),120);if(!name||!slug||!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))throw new Error('Isi nama acara dan slug dengan huruf kecil, angka, atau tanda hubung.');
 const description=String(form.get('description')||'').trim();if(description.length>10000)throw new Error('Deskripsi maksimal 10.000 karakter.');
 const dt=(key:string)=>{const s=String(form.get(key)||'');if(!s)return null;if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s))throw new Error('Tanggal tidak valid.');const d=new Date(s+'+07:00');if(!Number.isFinite(d.getTime()))throw new Error('Tanggal atau waktu tidak valid.');return d.toISOString();};
 const opens=dt('registration_opens_at'),closes=dt('registration_closes_at');if(opens&&closes&&closes<=opens)throw new Error('Waktu tutup harus setelah waktu buka.');
 const cap=clean(form.get('capacity'),10),capacity=cap?Number(cap):null;if(capacity!==null&&(!Number.isSafeInteger(capacity)||capacity<1))throw new Error('Kuota harus berupa bilangan bulat positif, atau kosong.');const color=clean(form.get('color'),7);if(!/^#[a-f0-9]{6}$/i.test(color))throw new Error('Warna tidak valid.');
 return {name,slug,description,location:clean(form.get('location'),500)||null,starts_at:dt('starts_at'),registration_opens_at:opens,registration_closes_at:closes,capacity,color};
}
export function wibInput(v:string|null){if(!v)return '';return new Date(new Date(v).getTime()+7*3600000).toISOString().slice(0,16);}
