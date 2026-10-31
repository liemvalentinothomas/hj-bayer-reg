# HJ Bayer — Registrasi Acara

Next.js untuk registrasi acara Hexpharm Jaya, hosting Vercel dan backend Supabase.

## Status

Login admin Supabase, pemeriksaan hak admin di server, halaman acara publik, panel pengelolaan acara draf/arsip, master PD–PC, editor revisi draf form, dan pratinjau admin tersedia. Panduan: docs/ADMIN-STAGE.md.

Daftar CSV 34 PD/478 PC menjadi sumber impor melalui tombol admin. Deploy tidak memasukkan data otomatis ke database. PD/PC yang belum tercantum dapat diketik manual pada pratinjau.

Belum diaktifkan: pendaftaran peserta, publikasi form, bukti/token registrasi, koreksi audit, manajemen peserta, unduh CSV, upload Storage dan salin acara. Pendaftaran tetap ditutup sampai backend siap dan diuji.

## Menjalankan

Node.js 24.x. Jalankan npm ci, salin .env.example ke .env.local dan isi koneksi, lalu npm run dev. Jangan commit .env.local, password, secret key, token sesi atau data peserta.

npm run build
npm run typecheck
node --experimental-strip-types --test tests/organization.test.mjs tests/forms.test.mjs
python tests/login-http.py
python tests/admin-http.py

Tes HTTP memakai Supabase simulasi lokal, tanpa kredensial asli atau perubahan produksi.

Deployment: docs/VERCEL-PREVIEW.md. Schema: docs/DATABASE-REVIEW.md. Acuan desain: prototype/desain-registrasi-v2.html (simulasi).

Database dasar sudah ada. Jangan mengulang migration awal atau mereset database. Sebelum pengujian tulis fitur berikutnya, gunakan database uji terpisah.
