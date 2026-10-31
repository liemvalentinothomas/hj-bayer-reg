import type {SupabaseClient} from '@supabase/supabase-js';
export async function assetUrl(client:SupabaseClient,path:string|null|undefined){if(!path)return null;const r=await client.storage.from('registration-assets').createSignedUrl(path,600);return r.error?null:r.data.signedUrl;}
