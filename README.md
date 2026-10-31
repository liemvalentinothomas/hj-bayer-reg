# HJ Bayer — Registrasi Acara

Next.js di Vercel, Supabase untuk PostgreSQL, Auth admin dan Storage. Acara pertama PIT Bidan 2026.

## Fitur

Pengelolaan/salin/arsip acara, organisasi PD–PC + manual, editor form bersyarat dan versi historis, publikasi, peserta tanpa akun/OTP, konfirmasi, pendaftaran transaksional, bukti bertoken, ringkasan/filter, CSV historis, koreksi dengan audit, dan aset gambar asli.

**Aktivasi database diperlukan:** jalankan migration tambahan `supabase/migrations/202610310001_full_features.sql` melalui SQL Editor. Panduan lengkap: `docs/ACTIVATE-ALL-FEATURES.md`. Deploy tidak otomatis menjalankan SQL atau membuka acara.

## Menjalankan

Node.js 24.x; npm ci; salin .env.example ke .env.local lalu isi URL dan publishable key Supabase; npm run dev.

Jangan commit password, secret key, token sesi, atau data peserta. Tidak diperlukan secret key server untuk implementasi ini; operasi publik memakai RPC terbatas dan operasi admin memeriksa sesi serta keanggotaan admin.

## Verifikasi

npm run build
npm run typecheck
node --experimental-strip-types --test tests/*.test.mjs
node --experimental-strip-types tests/database.mjs
python tests/login-http.py
python tests/admin-http.py

Pengujian memakai database lokal dan backend simulasi, bukan database produksi. Fixture schema berasal dari CSV struktur tabel dan kebijakan yang diberikan pemilik proyek. Uji penerimaan pada Supabase/Storage nyata dan pengiriman multi-koneksi masih diperlukan setelah migration.

Acuan desain: prototype/desain-registrasi-v2.html. Dokumen tahap sebelumnya disimpan sebagai catatan historis; status terbaru ada pada panduan aktivasi fitur lengkap.
