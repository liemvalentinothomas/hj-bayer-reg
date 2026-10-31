"""HTTP integration using a disposable local Supabase fixture; never production."""
import base64,http.client,json,os,subprocess,threading,time,uuid
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlencode,urlparse,parse_qs
uid='11111111-1111-4111-8111-111111111111'
eid='22222222-2222-4222-8222-222222222222'
tables={'events':[{'id':eid,'name':'Fixture event','slug':'fixture','status':'draft'}],'form_versions':[],'organization_pd':[],'organization_pc':[]}
allow_admin=True
class Fixture(BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def reply(self,status,payload,headers=None):
  b=json.dumps(payload).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(b)))
  for k,v in (headers or {}).items():self.send_header(k,v)
  self.end_headers()
  if self.command!='HEAD':self.wfile.write(b)
 def rows(self):
  u=urlparse(self.path);name=u.path.rsplit('/',1)[-1];params=parse_qs(u.query);rows=tables.get(name,[])
  for key,values in params.items():
   v=values[0]
   if v.startswith('eq.'):
    wanted=v[3:];rows=[r for r in rows if str(r.get(key)).lower()==wanted.lower()]
  if params.get('order',[''])[0]=='version.desc':rows=sorted(rows,key=lambda r:r['version'],reverse=True)
  if 'limit'in params:rows=rows[:int(params['limit'][0])]
  return name,rows
 def do_GET(self):
  if self.path.startswith('/auth/v1/user'):return self.reply(200,{'id':uid,'email':'fixture@example.test'})
  if self.path.startswith('/rest/v1/admin_users'):return self.reply(200,[{'user_id':uid}] if allow_admin else [])
  _,rows=self.rows();single='vnd.pgrst.object' in self.headers.get('Accept','');return self.reply(200,rows[0] if single and rows else rows)
 def do_HEAD(self):
  _,rows=self.rows();return self.reply(200,None,{'Content-Range':f'0-{max(0,len(rows)-1)}/{len(rows)}'})
 def do_POST(self):
  data=json.loads(self.rfile.read(int(self.headers.get('Content-Length','0'))))
  if self.path.startswith('/auth/v1/token'):
   enc=lambda x:base64.urlsafe_b64encode(json.dumps(x).encode()).decode().rstrip('=')
   token=enc({'alg':'HS256'})+'.'+enc({'sub':uid,'exp':int(time.time())+3600})+'.fixture'
   return self.reply(200,{'access_token':token,'refresh_token':'fixture-refresh','expires_in':3600,'token_type':'bearer','user':{'id':uid,'email':'fixture@example.test'}})
  if self.path.startswith('/rest/v1/rpc/hj_submit_registration'):return self.reply(200,{'ok':True,'receipt':{'id':eid,'number':'REG-FIXTURE','name':'Fixture','slug':'fixture'}})
  if self.path.startswith('/rest/v1/rpc/hj_registration_receipt'):return self.reply(200,None)
  if self.path.startswith('/rest/v1/rpc/hj_capabilities'):return self.reply(200,{'version':1,'registration':True})
  name,_=self.rows();rows=data if isinstance(data,list) else [data]
  for r in rows:r.setdefault('id',str(uuid.uuid4()));r.setdefault('active',True);tables[name].append(r)
  return self.reply(201,rows[0] if 'vnd.pgrst.object' in self.headers.get('Accept','') else rows)
 def do_PATCH(self):
  data=json.loads(self.rfile.read(int(self.headers['Content-Length'])));_,rows=self.rows()
  for r in rows:r.update(data)
  return self.reply(200,rows[0] if 'vnd.pgrst.object' in self.headers.get('Accept','') and rows else rows)
server=ThreadingHTTPServer(('127.0.0.1',0),Fixture);threading.Thread(target=server.serve_forever,daemon=True).start()
env={**os.environ,'NEXT_PUBLIC_SUPABASE_URL':f'http://127.0.0.1:{server.server_port}','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY':'fixture-public-key'}
p=subprocess.Popen(['node','node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3119'],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
cookie=''
def req(path,form=None,origin='http://127.0.0.1:3119',use_cookie=True):
 c=http.client.HTTPConnection('127.0.0.1',3119,timeout=30);headers={'Origin':origin}
 if use_cookie and cookie:headers['Cookie']=cookie
 if form is not None:headers['Content-Type']='application/x-www-form-urlencoded'
 c.request('POST' if form is not None else 'GET',path,urlencode(form) if form is not None else None,headers);r=c.getresponse();out=(r.status,dict(r.getheaders()),r.read().decode());c.close();return out
try:
 for i in range(50):
  try:req('/login');break
  except OSError:time.sleep(.1)
 no=req('/admin/actions',{'action':'event.archive','id':eid},use_cookie=False);assert no[0]==303 and no[1]['location'].endswith('/login');print('PASS unauthenticated admin mutation denied')
 login=req('/auth/login',{'email':'fixture@example.test','password':'fixture-only'});assert login[1]['location'].endswith('/admin');cookie=login[1]['set-cookie'].split(';')[0]
 for path in ['/admin','/admin/events/'+eid,'/admin/events/'+eid+'/form','/admin/events/'+eid+'/preview','/admin/organizations']:
  r=req(path);assert r[0]==200,(path,r[0]);print('PASS admin page',path)
 cross=req('/admin/actions',{'action':'event.archive','id':eid},origin='https://other.example');assert 'error='in cross[1]['location'] and tables['events'][0]['status']=='draft';print('PASS cross-origin mutation denied')
 r=req('/admin/actions',{'action':'event.save','id':eid,'name':'Updated event','slug':'fixture','color':'#EB318D','starts_at':'2026-11-05T17:30'});assert 'message='in r[1]['location'] and tables['events'][0]['starts_at']=='2026-11-05T10:30:00.000Z';print('PASS event save preserves draft and WIB')
 r=req('/admin/actions',{'action':'org.import'});assert 'message='in r[1]['location'] and len(tables['organization_pd'])==34 and len(tables['organization_pc'])==478;print('PASS 34 PD and 478 PC imported')
 r=req('/admin/actions',{'action':'org.import'});assert len(tables['organization_pd'])==34 and len(tables['organization_pc'])==478;print('PASS repeated import adds no duplicates')
 parent=tables['organization_pd'][0];r=req('/admin/actions',{'action':'org.pd.disable','id':parent['id']});assert 'error='in r[1]['location'] and parent['active'];print('PASS PD with active children cannot be disabled')
 definition=json.loads(subprocess.check_output(['node','--experimental-strip-types','--input-type=module','-e',"import {initialForm} from './lib/forms.ts'; console.log(JSON.stringify(initialForm()))"],stderr=subprocess.DEVNULL))
 payload={'action':'form.save','id':eid,'definition':json.dumps(definition),'base_version_id':''};r=req('/admin/actions',payload);assert 'message='in r[1]['location'] and len(tables['form_versions'])==1 and tables['form_versions'][0]['status']=='draft';print('PASS form save creates draft version without publishing')
 r=req('/admin/actions',payload);assert 'error='in r[1]['location'] and len(tables['form_versions'])==1;print('PASS stale editor version rejected')
 payload['base_version_id']=tables['form_versions'][0]['id'];definition['questions']=[q for q in definition['questions'] if q['id']!='hp'];payload['definition']=json.dumps(definition);r=req('/admin/actions',payload);assert 'error='in r[1]['location'] and len(tables['form_versions'])==1;print('PASS invalid core schema rejected before insert')
 # A new revision must not rewrite the previous definition.
 previous=json.dumps(tables['form_versions'][0]['definition'],sort_keys=True)
 valid=json.loads(subprocess.check_output(['node','--experimental-strip-types','--input-type=module','-e',"import {initialForm} from './lib/forms.ts'; console.log(JSON.stringify(initialForm()))"],stderr=subprocess.DEVNULL));valid['questions'][0]['label']='Revised name'
 payload['definition']=json.dumps(valid);r=req('/admin/actions',payload);assert 'message='in r[1]['location'] and len(tables['form_versions'])==2 and tables['form_versions'][1]['version']==2 and json.dumps(tables['form_versions'][0]['definition'],sort_keys=True)==previous;print('PASS new revision preserves historical definition')
 child=tables['organization_pc'][0];r=req('/admin/actions',{'action':'org.pc.disable','id':child['id']});assert not child['active'];r=req('/admin/actions',{'action':'org.import'});assert len(tables['organization_pc'])==478 and not child['active'];print('PASS import does not reactivate disabled PC')
 r=req('/admin/actions',{'action':'event.create','name':'Second event','slug':'second-event','color':'#EB318D'});assert 'message='in r[1]['location'] and len(tables['events'])==2 and tables['events'][1]['status']=='draft';print('PASS new event starts as draft')
 tables['registrations']=[{'id':str(uuid.uuid4()),'event_id':eid,'form_version_id':tables['form_versions'][0]['id'],'registration_number':'REG-TEST','full_name':'=SUM(1,2)','phone_normalized':'+628123456789','email':'','pd_name_snapshot':'Manual PD','pc_name_snapshot':'Manual PC','ranting':'Ranting','answers':{'nama':'=SUM(1,2)','hp':'+628123456789','delima':'Ya'},'created_at':'2026-10-31T00:00:00Z'}]
 r=req('/admin/events/'+eid+'/participants');assert r[0]==200 and 'REG-TEST' in r[2];print('PASS participant management renders scoped records')
 r=req('/admin/events/'+eid+'/export');assert r[0]==200 and r[1]['content-type'].startswith('text/csv') and "'=SUM(1,2)" in r[2] and 'receipt_token_hash' not in r[2];print('PASS CSV includes versioned answers and protects formulas')
 def post_json(path,body):
  c=http.client.HTTPConnection('127.0.0.1',3119,timeout=30);c.request('POST',path,json.dumps(body),{'Content-Type':'application/json','Origin':'http://127.0.0.1:3119'});r=c.getresponse();out=(r.status,json.loads(r.read()));c.close();return out
 public_body={'slug':'fixture','version':tables['form_versions'][0]['id'],'request':str(uuid.uuid4()),'token':'a'*64,'agree':True,'payload':{'answers':{},'org':{}}}
 r=post_json('/api/registrations',{**public_body,'agree':False});assert r[0]==400;print('PASS public registration requires confirmation')
 r=post_json('/api/registrations',{**public_body,'website':'bot-filled'});assert r[0]==400;print('PASS honeypot submission rejected')
 r=post_json('/api/registrations',public_body);assert r[0]==200 and r[1]['receipt']['number']=='REG-FIXTURE';print('PASS public route forwards validated envelope to transaction RPC')
 r=post_json('/api/receipt',{'slug':'fixture','id':eid,'token':'a'*64});assert r[0]==200 and r[1]['receipt']is None;print('PASS unknown receipt yields no participant data')
 allow_admin=False;r=req('/admin/actions',{'action':'event.archive','id':eid});assert r[1]['location'].endswith('/login') and tables['events'][0]['status']=='draft';print('PASS authenticated nonadmin mutation denied')
finally:p.terminate();p.wait(timeout=10);server.shutdown()
