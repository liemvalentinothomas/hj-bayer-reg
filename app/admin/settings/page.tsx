import {requireAdmin} from '@/lib/admin';
import {assetUrl} from '@/lib/assets';
import AdminShell from '@/components/AdminShell';
import AssetUploader from '@/components/AssetUploader';
export const dynamic='force-dynamic';
export default async function Settings(){const {client}=await requireAdmin();const s=await client.from('app_settings').select('company_logo_path').eq('singleton',true).maybeSingle();const url=await assetUrl(client,s.data?.company_logo_path);return <AdminShell><h1>Identitas perusahaan</h1><p>Logo Hexpharm Jaya digunakan pada seluruh acara. Menghapus logo unggahan mengembalikan logo asli bawaan.</p><AssetUploader kind="company_logo" title="Logo Hexpharm Jaya" preview={url||'/hj-logo.png'}/></AdminShell>;}
