# 📖 PANDUAN OPERASIONAL WASIT
## Aplikasi Turnamen Layangan Kabupaten Majalengka

Selamat bertugas, Rekan Wasit! Dokumen panduan praktis ini dirancang untuk membantu Anda menguasai seluruh fitur sistem bagan turnamen secara profesional, cepat, dan akurat langsung di lapangan.

---

## 🔐 1. Hak Akses & Login Wasit
Secara default, aplikasi berjalan dalam **Mode Penonton (Read-Only)** untuk keamanan data.
*   **Cara Masuk:** Klik tombol **"Masuk Sebagai Wasit"** di pojok kanan atas, lalu masukkan password wasit.
*   **Hak Akses Wasit:** Setelah masuk, Anda akan mendapatkan ikon gerigi dan menu pengaturan untuk mengendalikan jalannya seluruh turnamen.

---

## ⚙️ 2. Membuat Bagan Otomatis (Setup Wizard)
Fitur ini digunakan saat memulai turnamen baru. Klik menu **"Buat Bagan Otomatis"** di kanan atas untuk membuka panel pengaturan:

| Fitur / Pengaturan | Penjelasan & Panduan Praktis |
| :--- | :--- |
| **Identitas Turnamen** | Masukkan **Judul Turnamen** dan **Nama Panitia**. Anda juga dapat mengunggah **Logo Turnamen** yang akan langsung tampil gagah di bagian atas tajuk halaman. |
| **Tipe Cakupan Turnamen** | <ul><li>**Lokal / Club Match:** (Default) Memisahkan peserta dari tim yang sama. Format input nama: `[Nama Tim] Nama Peserta`.</li><li>**Open Cup (Lintas Daerah):** Memisahkan peserta dari daerah yang sama DAN tim yang sama secara bersamaan. Format input nama: `[Nama Daerah-Nama Tim] Nama Peserta` (contoh: `[Majalengka-Senyap] Andi`).</li></ul> |
| **Kapasitas Per Bagan** | Pilih ukuran bagan per pool (`16`, `32`, `64`, atau `AUTO`). Jika memilih `AUTO`, sistem akan otomatis membagi jumlah peserta secara seimbang ke dalam pool-pool yang diperlukan. |
| **Aturan Nyawa** | <ul><li>**1 Nyawa:** Format sistem gugur tunggal tradisional.</li><li>**2 Nyawa (Beda):** Setiap peserta mendapatkan 2 kesempatan bertanding. Bagan akan dikalikan 2 (Bagan AB & CD). Lawan di babak pertama Bagan CD diacak ulang secara otomatis untuk memastikan **tidak bertemu dengan lawan yang sama seperti di bagan AB**.</li></ul> |
| **Format Bagan Final** | <ul><li>**Liga (Round Robin):** 3 juara dari masing-masing pool akan dipertemukan dalam format liga segitiga untuk saling bertanding menentukan Juara 1, 2, dan 3 berdasarkan poin tertinggi.</li><li>**Bagan (Gugur):** Pertandingan final standar dengan sistem eliminasi langsung.</li></ul> |
| **Poin Penyisihan (R1)** | <ul><li>**Normal (1 Nyawa):** Klik sekali langsung lolos ke babak berikutnya.</li><li>**Duluan 2 Poin:** Berlaku khusus babak penyisihan (Ronde 1). Setiap game mencatat poin. Peserta pertama yang meraih **2 Poin** adalah pemenang pertandingan.</li></ul> |
| **Input Nama Peserta** | Masukkan nama peserta (satu nama per baris). Sesuaikan kurung siku `[...]` di depan nama dengan **Tipe Cakupan Turnamen** yang Anda pilih agar algoritma anti-bentrok berjalan dengan optimal. |

---

## ⚔️ 3. Manajemen Pertandingan Live (Match Controls)
Di setiap kartu pertandingan, tersedia kendali stopwatch dan status pertandingan real-time untuk membantu jalannya laga:

### A. Tombol Kontrol Pertandingan (Hanya Wasit)
*   **📢 Tombol Megaphone (Panggilan Lapak):** Mengaktifkan countdown panggilan selama **10 menit** bagi peserta yang belum hadir. Jika waktu habis, indikator akan berkedip merah terang bertanda waktu habis (Wasit dapat mendiskualifikasi peserta).
*   **🚩 Tombol Bendera (Persiapan):** Menandakan peserta sedang mempersiapkan layangan di lapak (Indikator kuning).
*   **▶️ / ⏸️ Tombol Play / Pause:** Memulai atau menjeda stopwatch jalannya pertandingan secara akurat.
*   **⏹️ Tombol Stop:** Menghentikan dan mereset waktu stopwatch pertandingan kembali ke `00:00`.

### B. Fitur Pencarian Cepat (Search)
*   Klik ikon **Kaca Pembesar (Search)** di pojok kanan atas.
*   Ketik nama peserta atau nama tim. Sistem akan langsung menyorot (highlight) dengan warna **Emerald Hijau berkilau** kartu pertandingan yang memuat peserta tersebut, memudahkan Anda menemukannya di bagan yang sangat luas.

---

## 🏆 4. Pencatatan Pemenang & Skor
Cara menentukan pemenang bergantung pada mode poin penyisihan yang Anda pilih saat setup:

### A. Jika Mode Normal (1 Nyawa) Aktif:
1.  Klik langsung **Nama Peserta** yang menang.
2.  Akan muncul pop-up konfirmasi: *"Apakah Anda yakin ingin menetapkan [Nama] sebagai pemenang?"*
3.  Klik **Ya, Konfirmasi**, maka peserta tersebut otomatis melaju ke babak berikutnya.

### B. Jika Mode "Duluan 2 Poin" Aktif (Khusus Ronde 1):
1.  **Tambah Poin (+1):** Klik nama peserta untuk menambah poinnya (dari `0 PTS` -> `1 PTS`).
2.  **Kunci Kemenangan (Poin ke-2):** Klik nama peserta sekali lagi untuk menaikkan ke `2 PTS`. Sistem akan memicu konfirmasi keamanan: *"Apakah Anda yakin [Nama] mendapatkan poin ke-2, memenangkan pertandingan, dan lolos ke babak berikutnya?"*. Klik **Ya** untuk meloloskannya.
3.  **Koreksi Skor (Tombol Minus `-`):** Jika terjadi salah input, klik tombol `-` berwarna merah di sebelah poin untuk mengurangi skor peserta tersebut sebesar -1 secara instan.
4.  **Batal Menang / Reset:** Jika pertandingan sudah terkunci dan ingin dibatalkan, klik nama pemenang sekali lagi dan konfirmasikan untuk mereset seluruh skor pertandingan tersebut kembali ke `0 - 0`.

---

## ⚙️ 5. Fitur Khusus & Koreksi Darurat
*   **Ubah Nama di Tengah Laga:** Klik ikon **Gerigi Kecil** di sebelah kanan nama peserta pada kartu pertandingan. Masukkan ejaan nama yang benar dan klik simpan.
*   **Diskualifikasi Instan (DIS):** Di dalam menu edit nama (klik ikon gerigi peserta), Anda dapat mengklik tombol merah **"❌ DISKUALIFIKASI PESERTA (DIS)"**. Nama peserta akan langsung dicoret merah, dan lawannya otomatis lolos ke babak berikutnya secara otomatis.
*   **Reset Bagan Tunggal:** Jika ingin membersihkan total satu Pool aktif saja, pilih menu pengaturan di kanan atas -> klik **"Reset Bagan [Nama Pool]"**.
*   **Reset Semua Bagan:** Menghapus seluruh data pertandingan di semua pool aktif secara permanen untuk memulai ulang dari nol.

---

## 🗃️ 6. Pengarsipan & Riwayat Turnamen
Setelah turnamen selesai dan Juara telah dinobatkan, Anda dapat mengamankan data tersebut:

1.  **Arsipkan Turnamen:** Klik menu **"Arsipkan Turnamen"** di kanan atas. 
    *   Sistem akan mengunci bagan aktif tersebut menjadi *Read-Only* (tidak bisa diotak-atik lagi oleh siapapun) dan menyimpannya di daftar **History / Arsip**.
    *   Bagan aktif Anda akan otomatis dikosongkan sehingga Anda siap membuat bagan turnamen baru berikutnya tanpa kehilangan data lama.
2.  **Kelola Arsip (Hapus Riwayat):** Klik menu **"Kelola Arsip"** di kanan atas.
    *   Akan tampil daftar seluruh arsip turnamen yang pernah dibuat.
    *   Untuk menghapus arsip lama yang sudah tidak diperlukan, klik ikon **Tong Sampah** merah. Sistem dilengkapi pengamanan **Double Confirmation** untuk memastikan tidak ada data arsip yang terhapus secara tidak sengaja.

---

> **Pesan Penting Lapangan:** Selalu pastikan gawai Anda terhubung ke internet agar seluruh koordinasi skor real-time dapat disinkronkan secara langsung ke layar monitor penonton di area turnamen! Selamat bertugas!
