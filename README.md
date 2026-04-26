# Portal Pengumuman Kelulusan SMANSA

Aplikasi web modern untuk verifikasi dan pengumuman hasil kelulusan siswa SMA Negeri 1 Samarinda. Dibangun dengan Next.js 15, TypeScript, dan MongoDB.

## Fitur Utama

- **Pengecekan Hasil Mandiri**: Siswa dapat mengecek hasil kelulusan menggunakan NISN dan Tanggal Lahir.
- **Tracer Study (Penelusuran Alumni)**: Siswa dapat mengisi rencana setelah lulus (Kuliah atau Kerja) melalui form yang terintegrasi.
- **Countdown Timer**: Sistem penguncian otomatis yang hanya akan terbuka sesuai jadwal yang ditentukan admin.
- **Dashboard Admin**: Panel kendali terpadu untuk mengatur jadwal, memo pengumuman, database siswa, dan memantau data alumni.
- **Export Data Tracer**: Admin dapat mengekspor data tracer study alumni ke format Excel (.xlsx) untuk kebutuhan pelaporan.
- **Tiptap Rich Text Editor**: Admin dapat mengatur informasi lanjutan dengan format teks lengkap (Bold, List, Link, dll).
- **Import CSV/Excel**: Sinkronisasi data ribuan siswa dalam hitungan detik melalui unggah file dengan modal review sebelum simpan.
- **DNS Fallback Connection**: Sistem koneksi database yang tangguh, mampu menangani masalah resolusi DNS (umum pada ISP tertentu) secara otomatis.
- **Rate Limiting & Security**: Dilengkapi pengaman API untuk mencegah brute force dan spamming.

## Teknologi

- **Framework**: Next.js 15 (App Router)
- **Bahasa**: TypeScript
- **Database**: MongoDB via Mongoose
- **Styling**: Tailwind CSS 4 + GSAP (Animations)
- **Editor**: Tiptap Editor
- **Data Export**: SheetJS (XLSX)
- **Notifications**: React Hot Toast

## Persiapan Dasar (Setup)

1. **Instalasi Dependency**:
   ```bash
   npm install
   ```

2. **Konfigurasi Environment**:
   Salin file `.env.example` menjadi `.env`:
   ```bash
   # Windows
   copy .env.example .env
   # Linux/Mac
   cp .env.example .env
   ```
   Buka file `.env` dan lengkapi nilai-nilainya (khususnya `MONGODB_URI` dan `ADMIN_PASSWORD`).

3. **Inisialisasi Database (Opsional)**:
   Gunakan script seed untuk mengisi data contoh:
   ```bash
   npm run seed
   ```

4. **Menjalankan di Mode Development**:
   ```bash
   npm run dev
   ```
   Akses di `http://localhost:3000`.

## Panduan Admin

- **Halaman Admin**: `http://localhost:3000/admin`.
- **Konfigurasi Portal**: Atur waktu pembukaan pengumuman dan tulis memo lanjutan untuk siswa.
- **Database Siswa**:
  - Download template CSV di tab Database.
  - Header yang didukung: `nisn,nama,status,tanggalLahir`.
  - Format `tanggalLahir` di CSV: `YYYY-MM-DD` (Contoh: `2008-05-14`).
  - Mendukung file `.csv`, `.xlsx`, dan `.xls`.
  - Gunakan modal **Review & Edit** untuk verifikasi akhir sebelum sinkronisasi.
- **Tracer Study**:
  - Tab **Tracer Study** menampilkan daftar alumni yang sudah mengisi data.
  - Klik baris data untuk melihat detail kontak dan rencana studi/kerja.
  - Gunakan tombol **Ekspor Excel** untuk mengunduh seluruh data alumni.

## Persiapan Production (Deployment)

1. **Build Project**:
   ```bash
   npm run build
   ```

2. **Deploy ke Vercel (Rekomendasi)**:
   - Hubungkan repo GitHub ke Vercel.
   - Masukkan semua isi `.env` ke bagian **Environment Variables** di Dashboard Vercel.

3. **Zonasi Waktu**:
   Pastikan input tanggal di Admin menggunakan format lokal. Database akan menyimpannya dalam format UTC, dan aplikasi akan menampilkan kembali sesuai zona waktu lokal (WITA).

---
© 2026 SMA Negeri 1 Samarinda. All Rights Reserved.
