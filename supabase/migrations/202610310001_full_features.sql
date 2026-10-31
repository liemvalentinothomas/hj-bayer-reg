-- HJ Bayer registration: additive migration, no reset, no automatic publication.
-- Run as the project owner after reviewing. Existing rows and IDs are preserved.
begin;
create schema if not exists hj_private;
revoke all on schema hj_private from public, anon, authenticated;
alter table public.registrations add column if not exists receipt_token_hash text;
alter table public.registrations add column if not exists request_hash text;
create table if not exists hj_private.rate_windows (
 key text not null, window_start timestamptz not null, hits integer not null default 0,
 primary key(key,window_start)
);
alter table hj_private.rate_windows enable row level security;
create index if not exists hj_rate_window_age on hj_private.rate_windows(window_start);

create or replace function hj_private.assert_form(d jsonb) returns void
language plpgsql set search_path='' as $$
declare q jsonb; s jsonb; seen text[]='{}'; sections text[]='{}'; k text; t text; core jsonb='{"nama":"text","hp":"phone","pd":"pd","pc":"pc","ranting":"ranting"}';
begin
 if d->>'schemaVersion' is distinct from '1' or jsonb_typeof(d->'questions') is distinct from 'array' or jsonb_typeof(d->'sections') is distinct from 'array' then raise exception 'Definisi form tidak valid.'; end if;
 if jsonb_array_length(d->'questions')>100 or jsonb_array_length(d->'sections') not between 1 and 30 then raise exception 'Jumlah bagian atau pertanyaan tidak valid.'; end if;
 for s in select value from jsonb_array_elements(d->'sections') loop
  k=s->>'id'; if k is null or k!~'^[a-zA-Z][a-zA-Z0-9_-]{0,79}$' or k=any(sections) or length(btrim(coalesce(s->>'title',''))) not between 1 and 160 then raise exception 'Bagian form tidak valid.'; end if; sections=array_append(sections,k);
 end loop;
 for q in select value from jsonb_array_elements(d->'questions') loop
  k=q->>'id';t=q->>'type';
  if k is null or k!~'^[a-zA-Z][a-zA-Z0-9_-]{0,79}$' or k=any(seen) or not coalesce((q->>'sectionId')=any(sections),false) or length(btrim(coalesce(q->>'label',''))) not between 1 and 250 or jsonb_typeof(q->'required') is distinct from 'boolean' or t is null or t not in ('text','textarea','radio','checkbox','select','number','date','phone','email','pd','pc','ranting') then raise exception 'Pertanyaan form tidak valid.'; end if;
  if core ? k and t<>core->>k then raise exception 'Tipe field sistem tidak dapat diubah.'; end if;
  if not(core ? k) and t in ('phone','pd','pc','ranting') then raise exception 'Field sistem tidak boleh diduplikasi.'; end if;
  if k in ('nama','hp','pd','pc') and not (q->>'required')::boolean then raise exception 'Nama, HP, PD dan PC wajib diisi.'; end if;
  if q ? 'condition' and q->'condition'<>'null'::jsonb then
   if core ? k or jsonb_typeof(q->'condition')<>'object' or not coalesce((q->'condition'->>'questionId')=any(seen),false) or length(coalesce(q->'condition'->>'equals',''))>200 then raise exception 'Aturan tampil tidak valid.'; end if;
  end if;
  if jsonb_typeof(q->'options') is distinct from 'array' then raise exception 'Opsi pertanyaan tidak valid.'; end if;
  if jsonb_array_length(q->'options')>50 or exists(select 1 from jsonb_array_elements(q->'options') o where jsonb_typeof(o)<>'string' or length(btrim(o#>>'{}')) not between 1 and 200) then raise exception 'Opsi pertanyaan tidak valid.'; end if;
  if t in ('select','radio','checkbox') and (jsonb_array_length(q->'options')=0 or (select count(*)<>count(distinct value) from jsonb_array_elements(q->'options'))) then raise exception 'Opsi jawaban kosong atau duplikat.'; end if;
  seen=array_append(seen,k);
 end loop;
 if not seen @> array['nama','hp','pd','pc','ranting'] then raise exception 'Field sistem belum lengkap.'; end if;
end; $$;

create or replace function hj_private.normalize_payload(d jsonb,p jsonb,allow_inactive boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare q jsonb; k text; t text; v jsonb; c jsonb; a jsonb='{}'; raw jsonb=p->'answers'; org jsonb=p->'org';
 pd uuid; pc uuid; pdname text; pcname text; phone text; name text; mail text; branch text; manual_pd boolean; manual_pc boolean; str text;
begin
 perform hj_private.assert_form(d);
 if jsonb_typeof(raw) is distinct from 'object' or jsonb_typeof(org) is distinct from 'object' or octet_length(p::text)>100000 then raise exception 'Data pendaftaran tidak valid.'; end if;
 manual_pd=org->>'pdId'='__manual__';manual_pc=manual_pd or org->>'pcId'='__manual__';
 if manual_pd then pdname=btrim(regexp_replace(coalesce(org->>'pdManual',''),'\s+',' ','g'));
 else
  begin pd=(org->>'pdId')::uuid; exception when invalid_text_representation then raise exception 'Pilih PD yang valid.'; end;
  select o.name into pdname from public.organization_pd o where o.id=pd and (o.active or allow_inactive);
 end if;
 if manual_pc then pcname=btrim(regexp_replace(coalesce(org->>'pcManual',''),'\s+',' ','g'));
 else
  begin pc=(org->>'pcId')::uuid; exception when invalid_text_representation then raise exception 'Pilih PC yang valid.'; end;
  select o.name into pcname from public.organization_pc o where o.id=pc and o.pd_id=pd and (o.active or allow_inactive);
 end if;
 if coalesce(length(pdname),0) not between 1 and 200 or coalesce(length(pcname),0) not between 1 and 200 then raise exception 'Nama PD dan PC wajib diisi atau dipilih sesuai daftar.'; end if;
 branch=btrim(regexp_replace(coalesce(org->>'ranting',''),'\s+',' ','g'));if length(branch)>200 then raise exception 'Ranting maksimal 200 karakter.'; end if;
 for q in select value from jsonb_array_elements(d->'questions') loop
  k=q->>'id';t=q->>'type';c=q->'condition';
  if c is not null and c<>'null'::jsonb and not coalesce((a->>(c->>'questionId')=c->>'equals') or (jsonb_typeof(a->(c->>'questionId'))='array' and (a->(c->>'questionId')) ? (c->>'equals')),false) then continue; end if;
  v=raw->k;
  if k='pd' then v=to_jsonb(pdname);elsif k='pc' then v=to_jsonb(pcname);elsif k='ranting' then v=to_jsonb(branch);end if;
  if (q->>'required')::boolean and (v is null or v='null'::jsonb or v='""'::jsonb or v='[]'::jsonb or (jsonb_typeof(v)='string' and btrim(v#>>'{}')='')) then raise exception 'Lengkapi jawaban wajib: %',q->>'label'; end if;
  if v is null or v='null'::jsonb or v='""'::jsonb then continue;end if;
  if t='checkbox' then
   if jsonb_typeof(v)<>'array' then raise exception 'Jawaban beberapa pilihan tidak valid.';end if;
   if jsonb_array_length(v)>50 or exists(select 1 from jsonb_array_elements(v) x where not (q->'options' @> jsonb_build_array(x))) then raise exception 'Pilihan jawaban tidak valid.';end if;
  elsif t in ('select','radio') then
   if not (q->'options' @> jsonb_build_array(v)) then raise exception 'Pilihan jawaban tidak valid.';end if;
  elsif t='number' then
   str=v#>>'{}';if str!~'^-?[0-9]{1,20}(\.[0-9]{1,10})?$' then raise exception 'Jawaban angka tidak valid.';end if;v=to_jsonb(str::numeric);
  elsif t='date' then
   begin str=v#>>'{}';if str!~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or to_char(str::date,'YYYY-MM-DD')<>str then raise exception 'Jawaban tanggal tidak valid.';end if;exception when datetime_field_overflow or invalid_datetime_format then raise exception 'Jawaban tanggal tidak valid.';end;
  else
   if jsonb_typeof(v)<>'string' or length(v#>>'{}')>(case when t='textarea' then 5000 else 1000 end) then raise exception 'Jawaban teks terlalu panjang atau tidak valid.';end if;v=to_jsonb(btrim(v#>>'{}'));
  end if;
  a=a||jsonb_build_object(k,v);
 end loop;
 name=btrim(regexp_replace(coalesce(a->>'nama',''),'\s+',' ','g'));
 phone=regexp_replace(coalesce(a->>'hp',''),'[ .()\-]','','g');
 if phone like '0%' then phone='+62'||substr(phone,2);elsif phone like '62%' then phone='+'||phone;end if;
 if phone!~'^\+[1-9][0-9]{7,14}$' then raise exception 'Nomor HP tidak valid. Gunakan format 08 atau +62.';end if;
 if length(name) not between 1 and 250 then raise exception 'Nama peserta tidak valid.';end if;
 mail=nullif(btrim(a->>'email'),'');if mail is not null and (length(mail)>254 or mail!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then raise exception 'Email tidak valid.';end if;
 a=a||jsonb_build_object('nama',name,'hp',phone,'pd',pdname,'pc',pcname,'ranting',branch,'_organization',jsonb_build_object('pd_source',case when manual_pd then 'manual' else 'master' end,'pc_source',case when manual_pc then 'manual' else 'master' end));
 return jsonb_build_object('full_name',name,'phone_normalized',phone,'email',mail,'pd_id',pd,'pc_id',pc,'pd_name_snapshot',pdname,'pc_name_snapshot',pcname,'ranting',branch,'answers',a);
end; $$;

create or replace function hj_private.receipt(r public.registrations) returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('id',r.id,'number',r.registration_number,'name',r.full_name,'phone',r.phone_normalized,'createdAt',r.created_at,'eventId',e.id,'slug',e.slug,'eventName',e.name,'startsAt',e.starts_at,'location',e.location) from public.events e where e.id=r.event_id;
$$;
create or replace function hj_private.hit(k text) returns integer language plpgsql security definer set search_path='' as $$
declare n integer;w timestamptz=date_trunc('minute',clock_timestamp());
begin
 delete from hj_private.rate_windows where window_start<w-interval '1 day';
 insert into hj_private.rate_windows(key,window_start,hits) values(k,w,1) on conflict(key,window_start) do update set hits=hj_private.rate_windows.hits+1 returning hits into n;return n;
end; $$;

create or replace function public.hj_submit_registration(p_slug text,p_version uuid,p_request uuid,p_token text,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare e public.events;v public.form_versions;r public.registrations;n jsonb;h text;request_digest text;
begin
 if p_token is null or p_token!~'^[0-9a-f]{64}$' or p_request is null or p_version is null or length(p_slug)>120 or octet_length(p_payload::text)>100000 then return jsonb_build_object('ok',false,'error','Permintaan pendaftaran tidak valid.');end if;
 h=encode(sha256(convert_to(p_token,'UTF8')),'hex');request_digest=encode(sha256(convert_to(p_payload::text,'UTF8')),'hex');
 select * into e from public.events where slug=p_slug for update;
 if not found then return jsonb_build_object('ok',false,'error','Acara tidak tersedia.');end if;
 select * into r from public.registrations where event_id=e.id and idempotency_key=p_request;
 if found then
  if r.receipt_token_hash=h and r.request_hash=request_digest then return jsonb_build_object('ok',true,'receipt',hj_private.receipt(r));end if;
  return jsonb_build_object('ok',false,'error','Permintaan ini sudah digunakan. Muat ulang dan periksa bukti pendaftaran.');
 end if;
 if e.status<>'open' then return jsonb_build_object('ok',false,'error','Pendaftaran acara belum dibuka atau sudah ditutup.');end if;
 if hj_private.hit('event:'||e.id::text)>600 then return jsonb_build_object('ok',false,'error','Pendaftaran sedang ramai. Tunggu satu menit lalu coba kembali.');end if;
 if hj_private.hit('phone:'||e.id::text||':'||encode(sha256(convert_to(coalesce(p_payload->'answers'->>'hp',''),'UTF8')),'hex'))>5 then return jsonb_build_object('ok',false,'error','Terlalu banyak percobaan untuk nomor ini. Tunggu satu menit.');end if;
 -- Failed validations roll back only this nested block, preserving rate counters.
 begin
  if e.registration_opens_at is not null and clock_timestamp()<e.registration_opens_at then raise exception 'Periode pendaftaran belum dimulai.';end if;
  if e.registration_closes_at is not null and clock_timestamp()>=e.registration_closes_at then raise exception 'Periode pendaftaran sudah berakhir.';end if;
  if p_version is distinct from e.published_form_version_id then raise exception 'Form telah diperbarui. Muat ulang halaman sebelum mendaftar.';end if;
  select * into v from public.form_versions where id=p_version and event_id=e.id and status='published';if not found then raise exception 'Form pendaftaran belum tersedia.';end if;
  n=hj_private.normalize_payload(v.definition,p_payload);
  if exists(select 1 from public.registrations where event_id=e.id and phone_normalized=n->>'phone_normalized') then raise exception 'Nomor HP ini sudah terdaftar untuk acara ini.';end if;
  if e.capacity is not null and (select count(*) from public.registrations where event_id=e.id)>=e.capacity then raise exception 'Kuota peserta sudah penuh.';end if;
  insert into public.registrations(event_id,form_version_id,registration_number,idempotency_key,full_name,phone_normalized,email,pd_id,pc_id,pd_name_snapshot,pc_name_snapshot,ranting,answers,receipt_token_hash,request_hash)
  values(e.id,v.id,'REG-'||upper(replace(gen_random_uuid()::text,'-','')),p_request,n->>'full_name',n->>'phone_normalized',n->>'email',(n->>'pd_id')::uuid,(n->>'pc_id')::uuid,n->>'pd_name_snapshot',n->>'pc_name_snapshot',n->>'ranting',n->'answers',h,request_digest) returning * into r;
  return jsonb_build_object('ok',true,'receipt',hj_private.receipt(r));
 exception when sqlstate 'P0001' then return jsonb_build_object('ok',false,'error',sqlerrm);
 when unique_violation then return jsonb_build_object('ok',false,'error','Nomor atau permintaan ini sudah terdaftar.');
 when others then return jsonb_build_object('ok',false,'error','Pendaftaran belum dapat diproses. Silakan coba kembali.');end;
end; $$;

create or replace function public.hj_registration_receipt(p_slug text,p_id uuid,p_request uuid,p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.registrations;
begin
 if p_token is null or p_token!~'^[0-9a-f]{64}$' or ((p_id is null)=(p_request is null)) then return null;end if;
 select x.* into r from public.registrations x join public.events e on e.id=x.event_id where e.slug=p_slug and ((p_id is not null and x.id=p_id) or (p_request is not null and x.idempotency_key=p_request)) and x.receipt_token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex');
 if not found then return null;end if;return hj_private.receipt(r);
end; $$;

create or replace function public.hj_publish_event(p_event uuid,p_version uuid) returns void language plpgsql security definer set search_path='' as $$
declare v public.form_versions;
begin
 if not coalesce(public.is_registration_admin(),false) then raise exception 'Akses admin diperlukan.';end if;
 perform 1 from public.events where id=p_event for update;if not found then raise exception 'Acara tidak ditemukan.';end if;
 select * into v from public.form_versions where id=p_version and event_id=p_event;
 if not found or v.status not in ('draft','published') then raise exception 'Versi form tidak valid.';end if;
 if exists(select 1 from public.form_versions where event_id=p_event and version>v.version) then raise exception 'Ada revisi form yang lebih baru. Muat ulang dan tinjau sebelum menerbitkan.';end if;
 perform hj_private.assert_form(v.definition);
 update public.form_versions set status='published' where id=v.id and status='draft';
 update public.events set published_form_version_id=v.id,status='open' where id=p_event;
end; $$;

create or replace function hj_private.lock_form_history() returns trigger language plpgsql set search_path='' as $$
begin
 if old.status='published' or exists(select 1 from public.registrations where form_version_id=old.id) then raise exception 'Versi form yang diterbitkan atau sudah dijawab tidak dapat diubah. Buat revisi baru.';end if;
 if tg_op='DELETE' then return old;end if;return new;
end; $$;
drop trigger if exists hj_lock_form_history on public.form_versions;
create trigger hj_lock_form_history before update or delete on public.form_versions for each row execute function hj_private.lock_form_history();

create or replace function public.hj_copy_event(p_event uuid,p_name text,p_slug text) returns uuid language plpgsql security definer set search_path='' as $$
declare e public.events;v public.form_versions;new_id uuid;
begin
 if not coalesce(public.is_registration_admin(),false) then raise exception 'Akses admin diperlukan.';end if;
 select * into e from public.events where id=p_event for share;if not found then raise exception 'Acara tidak ditemukan.';end if;
 insert into public.events(slug,name,description,location,starts_at,registration_opens_at,registration_closes_at,capacity,status,color,event_logo_path,banner_path,banner_position_x,banner_position_y)
 values(p_slug,btrim(p_name),e.description,e.location,e.starts_at,e.registration_opens_at,e.registration_closes_at,e.capacity,'draft',e.color,e.event_logo_path,e.banner_path,e.banner_position_x,e.banner_position_y) returning id into new_id;
 select * into v from public.form_versions where event_id=e.id order by version desc limit 1;
 if found then insert into public.form_versions(event_id,version,status,definition) values(new_id,1,'draft',v.definition);end if;return new_id;
end; $$;

create or replace function hj_private.audit_registration() returns trigger language plpgsql security definer set search_path='' as $$
declare reason text=current_setting('hj.correction_reason',true);
begin
 if not coalesce(public.is_registration_admin(),false) or length(btrim(coalesce(reason,'')))<3 then raise exception 'Koreksi memerlukan admin dan alasan perubahan.';end if;
 if (new.id,new.event_id,new.form_version_id,new.registration_number,new.idempotency_key,new.receipt_token_hash,new.request_hash,new.created_at) is distinct from (old.id,old.event_id,old.form_version_id,old.registration_number,old.idempotency_key,old.receipt_token_hash,old.request_hash,old.created_at) then raise exception 'Identitas dan token pendaftaran tidak dapat diubah.';end if;
 insert into public.registration_audit(registration_id,admin_user_id,reason,before_data,after_data) values(old.id,auth.uid(),reason,to_jsonb(old)-'receipt_token_hash'-'request_hash',to_jsonb(new)-'receipt_token_hash'-'request_hash');return new;
end; $$;
drop trigger if exists hj_registration_audit on public.registrations;
create trigger hj_registration_audit before update on public.registrations for each row execute function hj_private.audit_registration();
create or replace function public.hj_correct_registration(p_id uuid,p_payload jsonb,p_reason text) returns void language plpgsql security definer set search_path='' as $$
declare r public.registrations;n jsonb;d jsonb;event_id uuid;
begin
 if not coalesce(public.is_registration_admin(),false) then raise exception 'Akses admin diperlukan.';end if;
 if length(btrim(coalesce(p_reason,''))) not between 3 and 2000 then raise exception 'Alasan koreksi wajib diisi (3–2.000 karakter).';end if;
 select x.event_id into event_id from public.registrations x where x.id=p_id;
 perform 1 from public.events e where e.id=event_id for update;
 select * into r from public.registrations where id=p_id for update;if not found then raise exception 'Peserta tidak ditemukan.';end if;
 select definition into d from public.form_versions where id=r.form_version_id;
 n=hj_private.normalize_payload(d,p_payload,true);
 perform set_config('hj.correction_reason',btrim(p_reason),true);
 update public.registrations set full_name=n->>'full_name',phone_normalized=n->>'phone_normalized',email=n->>'email',pd_id=(n->>'pd_id')::uuid,pc_id=(n->>'pc_id')::uuid,pd_name_snapshot=n->>'pd_name_snapshot',pc_name_snapshot=n->>'pc_name_snapshot',ranting=n->>'ranting',answers=n->'answers' where id=p_id;
end; $$;

-- Only published referenced images may be read anonymously; bucket remains private.
insert into storage.buckets(id,name,public) values('registration-assets','registration-assets',false) on conflict(id) do nothing;
drop policy if exists hj_assets_admin on storage.objects;
create policy hj_assets_admin on storage.objects for all to authenticated using(bucket_id='registration-assets' and public.is_registration_admin()) with check(bucket_id='registration-assets' and public.is_registration_admin());
drop policy if exists hj_assets_published on storage.objects;
create policy hj_assets_published on storage.objects for select to anon,authenticated using(bucket_id='registration-assets' and (exists(select 1 from public.app_settings s where s.company_logo_path=objects.name) or exists(select 1 from public.events e where e.status in ('open','closed') and (e.banner_path=objects.name or e.event_logo_path=objects.name))));

create or replace function public.hj_event_summary(p_event uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not coalesce(public.is_registration_admin(),false) then raise exception 'Akses admin diperlukan.';end if;
 select jsonb_build_object('total',count(*),'pengurus',count(*) filter(where answers->>'pengurus'='Ya'),'delima',count(*) filter(where answers->>'delima'='Ya'),'delima_process',count(*) filter(where answers->>'delima'='Sedang dalam proses')) into result from public.registrations where event_id=p_event;
 return result||jsonb_build_object('pd',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select coalesce(pd_name_snapshot,'Belum diisi') name,count(*) total from public.registrations where event_id=p_event group by 1 order by 2 desc limit 20)x),'pc',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select coalesce(pc_name_snapshot,'Belum diisi') name,count(*) total from public.registrations where event_id=p_event group by 1 order by 2 desc limit 20)x),'duplicates',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from(select lower(btrim(regexp_replace(full_name,'\s+',' ','g'))) name,coalesce(pc_name_snapshot,'') pc,count(*) total from public.registrations where event_id=p_event group by 1,2 having count(*)>1 order by 3 desc limit 20)x));
end; $$;
revoke all on function public.hj_event_summary(uuid) from public,anon,authenticated;
grant execute on function public.hj_event_summary(uuid) to authenticated;

create or replace function public.hj_capabilities() returns jsonb language sql set search_path='' as $$ select '{"version":1,"registration":true,"assets":true,"audit":true}'::jsonb $$;
revoke all on all functions in schema hj_private from public,anon,authenticated;
revoke all on function public.hj_submit_registration(text,uuid,uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.hj_registration_receipt(text,uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.hj_publish_event(uuid,uuid) from public,anon,authenticated;
revoke all on function public.hj_copy_event(uuid,text,text) from public,anon,authenticated;
revoke all on function public.hj_correct_registration(uuid,jsonb,text) from public,anon,authenticated;
revoke all on function public.hj_capabilities() from public,anon,authenticated;
grant execute on function public.hj_submit_registration(text,uuid,uuid,text,jsonb),public.hj_registration_receipt(text,uuid,uuid,text),public.hj_capabilities() to anon,authenticated;
grant execute on function public.hj_publish_event(uuid,uuid),public.hj_copy_event(uuid,text,text),public.hj_correct_registration(uuid,jsonb,text) to authenticated;
notify pgrst,'reload schema';
commit;
