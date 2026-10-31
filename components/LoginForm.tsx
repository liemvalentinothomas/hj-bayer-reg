'use client';
import { useState } from 'react';
export default function LoginForm({error}:{error?:string}){
 const [pending,setPending]=useState(false);
 const messages:Record<string,string>={invalid:'Login belum berhasil. Periksa email dan kata sandi Anda.',forbidden:'Akun ini belum memiliki akses admin aplikasi.',access:'Pemeriksaan hak admin gagal. Hubungi pengelola aplikasi.',network:'Koneksi ke Supabase gagal atau terlalu lama. Silakan coba kembali.',config:'Konfigurasi Supabase belum sesuai. Periksa environment aplikasi.',rate:'Terlalu banyak percobaan masuk. Tunggu sebentar sebelum mencoba lagi.',origin:'Permintaan login tidak valid. Muat ulang halaman lalu coba kembali.'};
 return <form action="/auth/login" method="post" onSubmit={()=>setPending(true)} aria-busy={pending}><label>Email admin<input name="email" type="email" required autoComplete="username" maxLength={254}/></label><label>Kata sandi<input name="password" type="password" required autoComplete="current-password" maxLength={1024}/></label>{error&&<p role="alert" className="notice">{messages[error]||messages.invalid}</p>}<button type="submit" className="primary" disabled={pending}>{pending?'Sedang masuk…':'Masuk'}</button>{pending&&<p role="status">Memeriksa akun dan akses admin…</p>}</form>;
}
