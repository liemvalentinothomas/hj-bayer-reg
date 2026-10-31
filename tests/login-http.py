"""Local fixture only: no real credentials or production Supabase calls."""
import base64, http.client, json, os, subprocess, threading, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlencode
class Fixture(BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def reply(self,status,payload):
  b=json.dumps(payload).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(b)));self.end_headers();self.wfile.write(b)
 def do_POST(self):
  data=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
  if data['email']=='invalid@example.test':return self.reply(400,{'code':'invalid_credentials','msg':'Invalid login credentials'})
  def enc(v):return base64.urlsafe_b64encode(json.dumps(v).encode()).decode().rstrip('=')
  token=enc({'alg':'HS256'})+'.'+enc({'sub':'11111111-1111-4111-8111-111111111111','exp':int(time.time())+3600})+'.test'
  self.reply(200,{'access_token':token,'refresh_token':'fixture-refresh','expires_in':3600,'token_type':'bearer','user':{'id':'11111111-1111-4111-8111-111111111111','email':data['email']}})
 def do_GET(self):self.reply(200,{'user_id':'11111111-1111-4111-8111-111111111111'})
server=ThreadingHTTPServer(('127.0.0.1',0),Fixture);threading.Thread(target=server.serve_forever,daemon=True).start()
env={**os.environ,'NEXT_PUBLIC_SUPABASE_URL':f'http://127.0.0.1:{server.server_port}','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY':'fixture-public-key'}
p=subprocess.Popen(['node','node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3117'],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
def request(path,body=None,origin=None):
 c=http.client.HTTPConnection('127.0.0.1',3117,timeout=20);headers={}
 if body is not None:headers['Content-Type']='application/x-www-form-urlencoded'
 if origin:headers['Origin']=origin
 c.request('POST' if body is not None else 'GET',path,body,headers);r=c.getresponse();result=(r.status,dict(r.getheaders()),r.read().decode());c.close();return result
try:
 for i in range(50):
  try:request('/login');break
  except OSError:time.sleep(.1)
 page=request('/login');assert page[0]==200 and 'action="/auth/login"' in page[2];print('PASS native POST form rendered')
 bad=request('/auth/login',urlencode({'email':'invalid@example.test','password':'fixture-only'}),'http://127.0.0.1:3117');print('diagnostic',bad[0],bad[1].get('location'));assert bad[0]==303 and 'error=invalid' in bad[1]['location'];print('PASS invalid login redirects with error')
 good=request('/auth/login',urlencode({'email':'admin@example.test','password':'fixture-only'}),'http://127.0.0.1:3117');assert good[0]==303 and good[1]['location'].endswith('/admin') and 'set-cookie' in good[1];print('PASS admin fixture redirects and sets session cookie')
 cross=request('/auth/login',urlencode({'email':'admin@example.test','password':'fixture-only'}),'https://other.example');assert 'error=origin' in cross[1]['location'];print('PASS cross-origin login rejected')
finally:p.terminate();p.wait(timeout=10);server.shutdown()
