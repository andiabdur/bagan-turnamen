# Bagan Turnamen Layangan

Sistem Pemantauan Bagan Turnamen Layangan Real-time dengan desain modern, responsif, dan simpel.

## Fitur Utama
- **Total 128 Peserta**: Dibagi ke dalam 4 Pool (A, B, C, D), masing-masing 32 peserta.
- **Real-time Data**: Sinkronisasi otomatis menggunakan Firebase Firestore.
- **Dua Role Pengguna**:
  - **Wasit**: Memiliki hak akses untuk input peserta (Bulk Input) dan menentukan pemenang.
  - **Penonton**: Hanya dapat melihat bagan dan hasil pertandingan secara real-time.
- **Desain Premium**: Menggunakan Tailwind CSS dengan estetika modern, micro-animations, dan responsif mobile.
- **Tanpa Emoji**: UI menggunakan ikon Lucide React secara eksklusif.

## Teknologi
- **Frontend**: React (Vite)
- **Styling**: Tailwind CSS
- **Ikon**: Lucide React
- **Backend/Database**: Firebase (Auth & Firestore)

## Cara Hosting di Vercel

1. **Persiapan**:
   - Push kode ini ke repositori GitHub/GitLab/Bitbucket Anda.
2. **Deploy di Vercel**:
   - Buka Dashboard Vercel dan pilih **Add New Project**.
   - Impor repositori tersebut.
   - Vercel akan otomatis mendeteksi Vite.
3. **Konfigurasi Environment Variables**:
   - Masukkan variabel berikut di tab **Environment Variables** pada Vercel Dashboard:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
     - `VITE_APP_ID` (Gunakan ID unik untuk aplikasi Anda)
4. **Build & Deploy**: Klik **Deploy**.

## Pengembangan Lokal
1. `npm install`
2. Buat file `.env` dan isi dengan konfigurasi Firebase Anda.
3. `npm run dev`
