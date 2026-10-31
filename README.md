# HJ Bayer — Registrasi Acara

Next.js untuk registrasi acara Hexpharm Jaya, hosting Vercel dan backend Supabase.

## Status implementasi

Fondasi aplikasi tersedia: halaman acara publik, login admin Supabase, pemeriksaan keanggotaan admin di server, daftar acara admin, dan komponen PD–PC dengan fallback manual. Komponen organisasi belum terhubung ke alur registrasi produksi; data 34 PD/478 PC tetap tersedia di data/ sebagai sumber impor, belum diimpor ke database.

Belum tersedia: transaksi pendaftaran, token bukti, editor form, upload Storage, koreksi audit, ekspor CSV, dan manajemen acara. Tidak ada tombol yang mengklaim registrasi berhasil sebelum integrasi selesai.

## Menjalankan

Gunakan Node.js 24.x. Jalankan npm ci, salin .env.example ke .env.local dan isi koneksi, lalu npm run dev. Jangan commit .env.local, password, secret key atau data peserta.

Panduan deploy/uji: docs/VERCEL-PREVIEW.md.
Tinjauan schema: docs/DATABASE-REVIEW.md.
Acuan visual: prototype/desain-registrasi-v2.html (simulasi).

Database dasar sudah ada. Jangan menjalankan ulang migration awal atau mereset database. Pengujian tulis berikutnya harus memakai database uji terpisah.
