# HJ Bayer — Registrasi Acara

Website registrasi yang dapat digunakan kembali untuk berbagai acara Hexpharm Jaya. Acara pertama: Pertemuan Ilmiah Tahunan Bidan 2026.

## Platform

- Next.js untuk aplikasi
- Vercel untuk hosting
- Supabase untuk PostgreSQL, Auth admin, dan Storage

## Status

Repository baru diinisialisasi. Aplikasi Next.js, integrasi runtime, pengujian, dan deployment belum tersedia.

Fondasi database sudah dipasang pada proyek Supabase yang ada. Satu akun telah tercatat pada `public.admin_users`; login aplikasi belum diuji. Jangan menjalankan ulang migration awal atau mereset database.

## Acuan implementasi

- Desain: `desain-registrasi-v2.html` pada paket handover.
- Warna utama: `#EB318D`; logo Hexpharm Jaya asli dipertahankan.
- Peserta tanpa akun/OTP: halaman acara → form → konfirmasi → bukti.
- Nama dan nomor HP adalah field inti; nomor HP unik per acara setelah normalisasi.
- PD → PC menggunakan data master; ranting berupa teks bebas.
- Admin mengelola acara, versi form, organisasi, peserta, koreksi dengan audit, aset, dan CSV.
- Validasi, kuota, idempotensi, dan pemeriksaan akses harus diterapkan pada server/database.
- Vercel Preview harus menggunakan database uji yang terpisah sebelum pengujian tulis.

## Konfigurasi

Variabel yang direncanakan: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, dan `APP_URL`. Kunci server tambahan, jika diperlukan, disimpan hanya dalam environment server.

Jangan menyimpan password, secret key, token sesi, atau data peserta di repository.
