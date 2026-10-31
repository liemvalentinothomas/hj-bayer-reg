# Aktivasi fitur lengkap

Kode mencakup pengelolaan acara, master PD–PC, editor/revisi form, publikasi dan penutupan pendaftaran, pendaftaran peserta, konfirmasi dan bukti, ringkasan peserta, filter, CSV, koreksi dengan audit, logo/banner, posisi potong, dan salin acara tanpa peserta.

## Satu langkah pada Supabase

Sesi pengembang tidak memiliki koneksi pengelolaan database Supabase. Publishable key tidak memberi hak membuat fungsi/tabel/policy. Karena itu migration harus dijalankan pemilik proyek melalui SQL Editor.

1. Buka `supabase/migrations/202610310001_full_features.sql` pada repository, pilih Raw/Copy.
2. Supabase proyek HJ Bayer → SQL Editor → New query, tempel seluruh isi, lalu Run.
3. Jalankan `select public.hj_capabilities();`. Hasil yang diharapkan: version 1, registration/assets/audit true.
4. Muat ulang panel admin. Pesan aktivasi hilang dan tombol publikasi/penyalinan menjadi tersedia.

Migration ini bersifat tambahan dan dibungkus transaksi: menambah hash token dan request, tabel pembatasan laju privat, fungsi transaksi, audit koreksi, penguncian versi historis, dan kebijakan gambar. Tidak mereset tabel, menghapus peserta, mengganti UUID master, atau menerbitkan acara otomatis. Tidak membutuhkan secret key pada Vercel.

Jika query gagal, transaksi dibatalkan; kirim pesan error. Jangan mengulang migration awal. Migration ini telah diuji terhadap struktur dari dua CSV ekspor Anda, termasuk penerapan ulang sebelum dan setelah ada data uji.

## Menyiapkan acara

1. Data organisasi → Impor daftar PD–PC bila belum diimpor.
2. Kelola acara → isi nama, waktu/lokasi yang benar, periode registrasi dan kuota.
3. Unggah logo/banner jika tersedia. File asli PNG/JPG/WebP dipertahankan, bukan dirender ulang; logo maksimal 2 MB, banner 8 MB, gambar maksimal 20 juta piksel. SVG tidak diterima.
4. Editor form → tinjau pertanyaan → Simpan revisi draf → Pratinjau.
5. Klik Terbitkan form dan buka pendaftaran setelah informasi dan form siap. Acara mengikuti periode yang diatur; publication tidak mengarang tanggal atau lokasi.
6. Buka halaman publik, lakukan pengujian penerimaan pada lingkungan uji, kemudian gunakan acara produksi sesuai keputusan panitia.

## Perilaku penting

- Peserta tanpa akun/OTP; kepemilikan HP tidak diverifikasi.
- Database menormalisasi 08/62/+62, menjaga satu nomor per acara, dan memakai kunci idempotensi. Kuota/periode/versi form/relasi organisasi diperiksa dalam transaksi dengan row lock acara.
- Bukti memerlukan token acak 256 bit; hanya hash disimpan pada database. Nomor HP atau nomor registrasi tidak cukup untuk membaca bukti. Browser menyimpan ID/token minimal per acara, bukan seluruh jawaban.
- Pengiriman yang terputus bisa dipulihkan menggunakan kunci request dan token tersimpan. Daftarkan peserta lain mempertahankan bukti sebelumnya sampai pengiriman baru berhasil.
- Pemulihan bukti dari perangkat berbeda belum disediakan; peserta dapat menyimpan lewat dialog cetak/Simpan PDF browser.
- Rate limit database: 600 percobaan per acara per menit, 5 per input nomor HP per menit, ditambah honeypot. Ini bukan verifikasi identitas atau perlindungan bot penuh.
- Jawaban tersembunyi tidak disimpan. Koreksi memakai schema historis, alasan, dan audit otomatis; versi terbit tidak dapat ditimpa.
- CSV UTF-8 BOM menyertakan metadata dan jawaban historis per versi, melindungi formula injection, serta bisa mengunduh hasil filter atau seluruh acara.
- Bucket tetap privat. Admin dapat mengunggah; publik hanya memperoleh signed URL untuk gambar yang dirujuk acara open/closed atau logo perusahaan. Gambar yang dilepas dari tampilan tidak langsung dihapus agar salinan acara tetap utuh.
- Import master tidak otomatis mengaktifkan ulang organisasi nonaktif. PD/PC manual tetap tersedia dan tidak otomatis ditambahkan sebagai master.

## Validasi dan batas pemeriksaan

Build/TypeScript, tes logika form/organisasi/CSV/gambar, PostgreSQL lokal (PGlite) yang direkonstruksi dari schema/policy/index ekspor, dan HTTP dengan backend simulasi. Data peserta/database produksi tidak digunakan untuk percobaan menulis. Login asli sudah berhasil pada tahap sebelumnya.

Pengujian simultan multi-koneksi pada Supabase nyata, integrasi Storage nyata, perangkat HP fisik, dan alur peserta di deployment setelah migration masih memerlukan pengujian penerimaan. Vercel Preview tidak otomatis memisahkan database; gunakan database uji untuk percobaan tersebut.
