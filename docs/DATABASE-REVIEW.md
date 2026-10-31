# Tinjauan database — 31 Oktober 2026

Berdasarkan dua CSV schema dan constraint/policy/index yang diberikan pengguna; bukan pemeriksaan live.

- 8 tabel, 60 kolom, 94 definisi constraint/index/policy.
- Nomor HP unik per acara; format database mensyaratkan nomor internasional dengan tanda +. Normalisasikan 08 menjadi +628 sebelum insert.
- Idempotency key unik per acara; nomor registrasi unik global.
- Foreign key gabungan menjaga relasi PC–PD dan form version–event.
- PD/PC nullable; snapshot nama mendukung input manual. ID sintetis dari JSON prototipe tidak boleh dimasukkan sebagai UUID master.
- Status event: draft/open/closed/archived. Event open wajib memiliki published_form_version_id.
- Admin ditentukan oleh admin_users; policy menggunakan is_registration_admin(). Definisi fungsi, grants, triggers, RLS enabled dan Storage tidak tercakup pada CSV terbaru. Jangan menyebut audit keamanan lengkap.
- Public dapat membaca event open/closed, form terbit yang sedang digunakan, dan master organisasi aktif. Tidak ada policy public registrations pada ekspor.
- Belum ada kolom token bukti. Diperlukan migration lanjutan beserta transaksi pendaftaran, penguncian kuota, validasi form/organisasi, idempotensi, audit, dan pembatasan laju.
- Policy update form_versions belum membuktikan versi terbit tidak bisa diubah; penguncian versi historis harus ditambahkan atau diverifikasi.

Tidak ada perubahan database produksi yang dijalankan dalam tahap ini.
