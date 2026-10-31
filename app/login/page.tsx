import Brand from '@/components/Brand';
import { configured } from '@/lib/supabase/server';
import { login } from './actions';
export default async function Login({searchParams}:{searchParams:Promise<{error?:string}>}){
 const {error}=await searchParams;
 return <><Brand/><main className="narrow"><p className="eyebrow">ADMIN UTAMA</p><h1>Selamat datang kembali.</h1><p className="muted">Masuk untuk mengelola acara dan pendaftaran.</p>{!configured()?<p role="alert" className="notice">Konfigurasi Supabase belum tersedia pada environment aplikasi.</p>:<form action={login}><label>Email admin<input name="email" type="email" required autoComplete="username" maxLength={254}/></label><label>Kata sandi<input name="password" type="password" required autoComplete="current-password" maxLength={1024}/></label>{error&&<p role="alert" className="notice">{error==='forbidden'?'Akun ini tidak memiliki akses admin aplikasi.':'Login belum berhasil. Periksa email dan kata sandi Anda.'}</p>}<button className="primary">Masuk</button></form>}<a href="/">← Halaman acara</a></main></>;
}
