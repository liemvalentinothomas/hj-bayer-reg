# Panel pengelolaan — tahap 2

## Tersedia

- Daftar acara, membuat acara draf, mengubah informasi, kuota, periode registrasi, warna, dan waktu acara dalam WIB.
- Mengarsipkan acara tanpa menghapus data; mengembalikan arsip sebagai draf.
- Data organisasi bersama: impor CSV 34 PD/478 PC, tambah/ubah nama PD dan PC, filter PC menurut PD, penonaktifan tanpa menghapus riwayat. Impor dapat diulang dan tidak mengaktifkan kembali master yang nonaktif.
- Editor pertanyaan dan bagian: label, petunjuk, tipe jawaban, opsi, wajib isi, aturan tampil berdasarkan pertanyaan sebelumnya, duplikasi, penghapusan pada revisi baru, serta urutan dalam bagian. Nama/HP/PD/PC/ranting dilindungi; kelompok PD–PC–ranting tetap berurutan.
- Setiap simpan menghasilkan baris form_versions baru dengan status draft. Versi historis tidak ditimpa. Konflik tab menggunakan base version; constraint versi unik tetap menjadi penjaga ketika dua pengiriman bersamaan terjadi.
- Pratinjau admin membaca draf terakhir tersimpan, menggunakan master aktif, mendukung PD manual + PC manual maupun PC manual untuk PD terdaftar. Ranting teks bebas. Ringkasan jawaban tidak menyimpan peserta.
- Pengiriman admin memakai POST, validasi server, pemeriksaan keanggotaan admin, origin yang sama, dan RLS Supabase.

## Cara mencoba

1. Setelah deployment terbaru Ready, login admin dan buka Data organisasi.
2. Klik Impor daftar PD–PC. Tindakan ini menambah master di database yang terhubung; aplikasi tidak mengimpor otomatis saat deploy.
3. Kembali ke Daftar acara → Kelola acara → Editor form.
4. Tinjau template, simpan revisi draf, lalu buka Pratinjau tersimpan.
5. Coba PD–PC yang tersedia dan opsi manual. Klik Periksa jawaban; ini tidak membuat pendaftaran.

## Batas tahap ini

Belum mengaktifkan pendaftaran peserta, penerbitan form, bukti/token, koreksi audit, manajemen peserta, CSV, unggah Storage, maupun penyalinan acara. Menetapkan periode tidak membuka registrasi. Publikasi dinonaktifkan sampai transaksi pendaftaran dan pengujiannya tersedia.

Tidak memerlukan migration baru untuk fitur tahap ini. Database produksi tidak dimutasi oleh pengujian pengembang. Untuk pengujian tulis fitur berikutnya, sediakan database uji terpisah. Preview Vercel tidak memisahkan database secara otomatis.

Impor berjalan secara bertahap, bukan satu transaksi database. Jika terputus, sebagian data mungkin sudah masuk; jalankan ulang untuk melengkapi. Sumber impor pada tahap ini adalah CSV yang sudah disertakan dalam repository, belum unggah CSV bebas.

Tabel PC dan pratinjau dibatasi 1.000 PC pada tahap ini; sumber saat ini 478 PC. Pratinjau membaca daftar aktif, bukan ID sintetis pada JSON prototipe.

## Pengujian

- Production build dan TypeScript.
- Tes logika schema dan organisasi (12 kasus).
- HTTP dengan Supabase simulasi lokal: halaman admin, larangan nonadmin/anon dan origin berbeda, informasi acara/WIB, impor ulang, penonaktifan, versi historis dan konflik draf.
- Login akun asli telah berhasil pada tahap sebelumnya menurut screenshot pengguna. Fitur baru belum diuji pada database produksi atau HP fisik.
