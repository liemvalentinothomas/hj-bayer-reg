# Pilihan organisasi IBI

Sumber: ibi_pd_pc.csv yang diberikan pengguna. 34 PD dan 478 pasangan PD–PC, tanpa baris kosong atau pasangan duplikat. Nama dipertahankan dari CSV; kelengkapan terhadap daftar resmi belum diverifikasi.

- Pilihan PC mengikuti PD terpilih.
- PD tidak tersedia: pilih “PD / provinsi tidak ada dalam daftar”, lalu wajib ketik nama PD dan PC.
- PC tidak tersedia pada PD yang tersedia: pilih “PC tidak ada dalam daftar”, lalu wajib ketik nama PC.
- Mengganti PD membersihkan pilihan PC dan teks manual sebelumnya.
- Ranting tetap teks bebas.
- Isian manual harus tampil pada konfirmasi, bukti, admin dan ekspor. Jangan menambahkan isian peserta otomatis ke master.
- Pada integrasi database, simpan ID master nullable, snapshot nama, serta sumber master/manual. Validasi relasi dan isian manual pada server. Migration lanjutan menunggu pemeriksaan schema live.

Prototipe pada prototype/desain-registrasi-v2.html telah disesuaikan. Belum terhubung ke Supabase, belum deployment atau aplikasi Next.js.
