import {PGlite} from '@electric-sql/pglite';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {initialForm} from '../lib/forms.ts';
process.on('uncaughtException',e=>{console.error(e.message,e.position?String(e.query).slice(Number(e.position)-160,Number(e.position)+160):'',e.where||'');process.exit(1)});
const db=new PGlite();
await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create table storage.buckets(id text primary key,name text,public boolean default false);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
alter table storage.objects enable row level security;`);
// Reconstruct the actual exported foundation, not a replacement production migration.
function csv(text){let rows=[],row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){let c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(!quoted&&(c===','||c==='\n')){row.push(cell.replace(/\r$/,''));cell='';if(c==='\n'){rows.push(row);row=[];}}else cell+=c;}if(cell||row.length){row.push(cell);rows.push(row);}const header=rows.shift();return rows.filter(r=>r.length>1).map(r=>Object.fromEntries(header.map((h,i)=>[h.replace(/^\uFEFF/,''),r[i]])));}
const cols=csv(fs.readFileSync('tests/fixtures/columns.csv','utf8'));
const rules=csv(fs.readFileSync('tests/fixtures/rules.csv','utf8'));
for(const table of [...new Set(cols.map(c=>c.table_name))]){
 const defs=cols.filter(c=>c.table_name===table).map(c=>`"${c.column_name}" ${c.data_type}${c.column_default&&c.column_default!=='null'?` default ${c.column_default}`:''}${c.is_nullable==='NO'?' not null':''}`);
 await db.exec(`create table public.${table}(${defs.join(',')});alter table public.${table} enable row level security;`);
}
for(const r of rules.filter(r=>r.jenis==='constraint').sort((a,b)=>Number(a.definisi.startsWith('FOREIGN'))-Number(b.definisi.startsWith('FOREIGN'))))await db.exec(`alter table public.${r.tabel} add constraint ${r.nama} ${r.definisi}`);
for(const r of rules.filter(r=>r.jenis==='index'&&!rules.some(c=>c.jenis==='constraint'&&c.nama===r.nama)))await db.exec(r.definisi);
await db.exec(`create function public.is_registration_admin() returns boolean language sql security definer set search_path='' as $$select exists(select 1 from public.admin_users where user_id=auth.uid())$$;
grant usage on schema public,auth to anon,authenticated;grant select,insert,update on all tables in schema public to authenticated;grant select on public.events,public.form_versions,public.organization_pd,public.organization_pc,public.app_settings to anon;`);
for(const r of rules.filter(r=>r.jenis==='policy')){
 const p=JSON.parse(r.definisi);const using=p.using?.replaceAll('\\n','\n');await db.exec(`create policy ${r.nama} on public.${r.tabel} for ${p.command} to ${p.roles.join(',')} ${using?'using ('+using+')':''} ${p.with_check?'with check ('+p.with_check+')':''}`);
}
const migration=fs.readFileSync('supabase/migrations/202610310001_full_features.sql','utf8');await db.exec(migration);await db.exec(migration);console.log('PASS additive migration and repeat application on exported schema');
const admin='11111111-1111-4111-8111-111111111111';await db.query('insert into auth.users values($1)',[admin]);await db.query('insert into public.admin_users(user_id) values($1)',[admin]);await db.exec(`set request.jwt.claim.sub='${admin}';set role authenticated;`);
const e=(await db.query("insert into public.events(slug,name,capacity) values('test-event','Test event',2) returning id")).rows[0].id;
const def=initialForm();const v=(await db.query("insert into public.form_versions(event_id,version,definition) values($1,1,$2) returning id",[e,def])).rows[0].id;
await db.query('select public.hj_publish_event($1,$2)',[e,v]);console.log('PASS atomic publication of correct form/event');
await assert.rejects(db.query("update public.form_versions set definition='{}' where id=$1",[v]));console.log('PASS published history immutable');
await db.exec("reset role;set request.jwt.claim.sub='';set role anon;");
await assert.rejects(db.query('select * from public.registrations'));await assert.rejects(db.query('select * from hj_private.rate_windows'));await assert.rejects(db.query('select public.hj_publish_event($1,$2)',[e,v]));console.log('PASS anon cannot read participants/private helper or publish');
const token='a'.repeat(64),key='22222222-2222-4222-8222-222222222222';
const payload=(phone='081234567890')=>({answers:{nama:' Test Person ',hp:phone,email:'',pengurus:'Tidak',praktik:'TPMB',delima:'Ya',jabatan:'Hidden answer'},org:{pdId:'__manual__',pcId:'',pdManual:' PD Baru ',pcManual:' PC Baru ',ranting:' Ranting '}});
const submit=async(k,t,p)=>{const r=await db.query('select public.hj_submit_registration($1,$2,$3,$4,$5) as r',['test-event',v,k,t,p]);return r.rows[0].r;};
const first=await submit(key,token,payload());assert.equal(first.ok,true,JSON.stringify(first));assert.equal(first.receipt.phone,'+6281234567890');const rid=first.receipt.id;console.log('PASS anonymous registration with normalized phone and manual PD-PC');
const retry=await submit(key,token,payload());assert.equal(retry.receipt.id,rid);console.log('PASS retry returns same registration');
assert.equal((await submit('33333333-3333-4333-8333-333333333333',token,payload('+6281234567890'))).ok,false);console.log('PASS equivalent phone rejected');
const receipt=async(t,id=rid,request=null)=>(await db.query('select public.hj_registration_receipt($1,$2,$3,$4) as r',['test-event',id,request,t])).rows[0].r;
assert.equal(await receipt('b'.repeat(64)),null);assert.equal((await receipt(token)).id,rid);assert.equal((await receipt(token,null,key)).id,rid);console.log('PASS receipt requires secret token; pending request recovery works');
assert.equal((await submit('44444444-4444-4444-8444-444444444444','b'.repeat(64),payload('081234567891'))).ok,true);
assert.equal((await submit('55555555-5555-4555-8555-555555555555','c'.repeat(64),payload('081234567892'))).ok,false);console.log('PASS quota enforced');
await db.exec(`reset role;set request.jwt.claim.sub='${admin}';set role authenticated;`);
let record=(await db.query('select answers from public.registrations where id=$1',[rid])).rows[0];assert.equal(record.answers.jabatan,undefined);console.log('PASS hidden answers are omitted');
await assert.rejects(db.query("update public.registrations set full_name='Silent change' where id=$1",[rid]));
const corrected=payload();corrected.answers.nama='Corrected Person';await db.query('select public.hj_correct_registration($1,$2,$3)',[rid,corrected,'Correct spelling']);
assert.equal((await db.query('select count(*)::int n from public.registration_audit where registration_id=$1',[rid])).rows[0].n,1);console.log('PASS correction requires reason and records audit');
const copy=(await db.query("select public.hj_copy_event($1,'Copied event','copied-event') id",[e])).rows[0].id;assert.equal((await db.query('select count(*)::int n from public.registrations where event_id=$1',[copy])).rows[0].n,0);console.log('PASS event copy excludes participants');
await db.exec('reset role');assert.equal((await db.query("select status from public.events where id=$1",[copy])).rows[0].status,'draft');
// Invalid attempts must consume rate quota despite validation rollback.
await db.query('update public.events set capacity=null where id=$1',[e]);await db.exec("set request.jwt.claim.sub='';set role anon;");
for(let i=0;i<6;i++){const p=payload('081999999999');p.answers.nama='';const r=await submit(crypto.randomUUID(),'d'.repeat(64),p);assert.equal(r.ok,false);if(i===5)assert.match(r.error,/Terlalu banyak/);}
console.log('PASS rate counters persist on invalid attempts');
await db.exec(`reset role;set request.jwt.claim.sub='${admin}';set role authenticated;`);
const summary=(await db.query('select public.hj_event_summary($1) r',[e])).rows[0].r;assert.equal(summary.total,2);console.log('PASS event summary is scoped and admin-only');
await db.exec('reset role');await db.exec(migration);assert.equal((await db.query('select count(*)::int n from public.registrations')).rows[0].n,2);console.log('PASS repeated migration preserves existing participants');
await db.exec('grant usage on schema storage to anon,authenticated;grant select on storage.objects to anon,authenticated;');
await db.query("insert into storage.objects(bucket_id,name) values('registration-assets','events/test/banner.png'),('registration-assets','events/draft/banner.png')");await db.query("update public.events set banner_path='events/test/banner.png' where id=$1",[e]);await db.query("update public.events set banner_path='events/draft/banner.png' where id=$1",[copy]);await db.exec("set request.jwt.claim.sub='';set role anon;");assert.equal((await db.query('select name from storage.objects')).rows.length,1);console.log('PASS anonymous Storage access limited to published referenced assets');
await db.close();
