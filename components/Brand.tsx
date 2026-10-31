import {configured,supabaseServer} from '@/lib/supabase/server';
import {assetUrl} from '@/lib/assets';
export default async function Brand({eventLogoPath,eventName}:{eventLogoPath?:string|null;eventName?:string}){
 let logo='/hj-logo.png',eventLogo:string|null=null;
 if(configured()){try{const c=await supabaseServer();const s=await c.from('app_settings').select('company_logo_path').eq('singleton',true).maybeSingle();logo=await assetUrl(c,s.data?.company_logo_path)||logo;eventLogo=await assetUrl(c,eventLogoPath);}catch{}}
 return <header><a href="/" className="brand">{eventLogo&&<img className="event-logo" src={eventLogo} alt="Logo acara"/>}<span>{eventName||'Ruang Registrasi'}<small>Hexpharm Jaya</small></span></a><img className="company-logo" src={logo} alt="Hexpharm Jaya — A Kalbe Company" width="180" height="36"/></header>;
}
