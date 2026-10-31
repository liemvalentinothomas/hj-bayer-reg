import Brand from '@/components/Brand';
import LoginForm from '@/components/LoginForm';
import { configured } from '@/lib/supabase/server';
export default async function Login({searchParams}:{searchParams:Promise<{error?:string}>}){
 const {error}=await searchParams;
 return <><Brand/><main className="narrow"><p className="eyebrow">ADMIN UTAMA</p><h1>Selamat datang kembali.</h1><p className="muted">Masuk untuk mengelola acara dan pendaftaran.</p>{!configured()?<p role="alert" className="notice">Konfigurasi Supabase belum tersedia pada environment aplikasi.</p>:<LoginForm error={error}/>}<a href="/">← Halaman acara</a></main></>;
}
