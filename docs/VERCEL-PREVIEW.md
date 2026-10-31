# Uji awal aplikasi di Vercel

Tahap ini hanya login admin dan daftar acara. Pendaftaran peserta, editor form, koreksi, aset Storage, bukti dan CSV belum diaktifkan.

1. Vercel → Add New → Project → impor liemvalentinothomas/hj-bayer-reg.
2. Framework Next.js, root directory ./, build npm run build. Gunakan Node.js 24.x.
3. Environment Variables:
   - NEXT_PUBLIC_SUPABASE_URL: URL proyek Supabase, tanpa /rest/v1/.
   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable key proyek.
   - APP_URL: URL deployment ketika sudah tersedia (belum digunakan pada tahap ini).
4. Nilai koneksi disimpan melalui dashboard Vercel, bukan di repository.
5. Deploy, buka /login, lalu login menggunakan email/password admin yang disimpan sendiri.
6. Pastikan akun yang ada pada admin_users melihat daftar acara termasuk draft; logout harus mengembalikan ke login. Akses /admin tanpa sesi harus diarahkan ke /login.
7. Halaman / hanya menampilkan acara open/closed. Event draft tidak muncul publik dan URL publiknya menghasilkan 404. Halaman kosong saat seluruh acara draft adalah hasil yang diharapkan.

Deployment pertama dari main dapat dilabeli Production oleh Vercel. Ini tidak berarti aplikasi siap menerima peserta. Batasi akses deployment melalui pengaturan proyek selama pembangunan. Preview Vercel tidak memisahkan database Supabase secara otomatis. Tahap ini tidak menyediakan mutasi data acara/peserta; sebelum mengaktifkan mutasi, sediakan database uji.

## Validasi lokal

npm ci
npm run build
npm run typecheck
node --experimental-strip-types --test tests/organization.test.mjs

Build dan 5 tes logika organisasi lulus secara lokal. Login Supabase, hak akses runtime dan tampilan HP belum diuji secara end-to-end.

Dokumentasi acuan:
- https://nextjs.org/docs/app/getting-started/installation
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://supabase.com/docs/reference/javascript/auth-getuser
