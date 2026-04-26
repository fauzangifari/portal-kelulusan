# Codebase Analysis: Web Pengumuman Kelulusan SMANSA

Dokumen ini berisi analisis komprehensif mengenai struktur dan arsitektur dari repositori **Web Pengumuman Kelulusan SMANSA** yang dibangun untuk memfasilitasi verifikasi kelulusan siswa SMA Negeri 1 Samarinda.

## 1. Ikhtisar Sistem & Arsitektur

Aplikasi ini dibangun menggunakan arsitektur modern SSR (Server-Side Rendering) dan API rute bawaan dari **Next.js 15 (App Router)**. Proyek ini memisahkan secara tegas antara "sisi klien" (area publik untuk siswa) dan "sisi manajerial" (area khusus admin). 

- **Area Publik (`/`)**: Terdiri dari komponen visual kaya animasi yang menggunakan `GSAP`. Fitur utamanya adalah *countdown timer* yang menghalangi siswa untuk mengecek kelulusan sebelum jadwal resmi dibuka.
- **Area Admin (`/admin`)**: Terdiri dari dashboard tempat admin bisa mengubah konfigurasi (*announcement date* dan *memo* yang menggunakan Tiptap Rich Text) serta modul import/sinkronisasi massal data siswa menggunakan file CSV.

## 2. Stack Teknologi

- **Core Framework**: Next.js 15.2, React 19.
- **Bahasa Pemrograman**: TypeScript, menjamin *type-safety* di seluruh layer (model database hingga komponen klien).
- **Database**: MongoDB (diakses menggunakan Mongoose 8.19).
- **Styling & Animasi**: Tailwind CSS v4, dikombinasikan dengan GSAP (GreenSock) untuk animasi fluid pada modal hasil kelulusan dan kemunculan elemen.
- **Keamanan**: Implementasi *Rate Limiting* pada rute API (mencegah *brute-force* atau cek massal), serta kontrol sesi untuk area Admin.

## 3. Struktur Direktori Utama

Pemisahan logika mengikuti prinsip *Separation of Concerns*:

```text
src/
├── app/                  # Next.js App Router (Rute Halaman & API)
│   ├── admin/            # Halaman Dashboard Admin & Login Form
│   ├── api/              # Kumpulan Endpoint REST API (Admin, Config, Result)
│   ├── globals.css       # File utama Tailwind CSS
│   └── page.tsx          # Halaman Utama (Portal Pengecekan Siswa)
├── lib/                  # Logika Bisnis & Utilitas Sistem
│   ├── admin-auth.ts     # Manajemen Autentikasi Admin
│   ├── mongoose.ts       # Manajemen Koneksi ke MongoDB
│   ├── rate-limit.ts     # Middleware Anti-Spam & Rate Limiter
│   ├── student-csv.ts    # Parser CSV & Validasi Data Siswa
│   └── student-repository.ts # Lapisan Akses Data (Data Access Layer) Siswa
└── models/               # Definisi Skema Database (Mongoose)
    ├── admin-session.ts
    ├── config.ts
    └── student.ts
```

## 4. Model & Database

Data disimpan pada MongoDB dengan skema sebagai berikut:

### Model `Student` (`src/models/student.ts`)
Digunakan untuk merekam data kelulusan setiap individu.
- **`nisn`** (String): Kunci identitas utama (10 digit angka).
- **`nama`** (String): Nama lengkap siswa.
- **`status`** (String): Enum dengan nilai `"LULUS"` atau `"TIDAK LULUS"`.
- **`tanggalLahir`** (String): Tanggal kelahiran dalam format `YYYY-MM-DD` (diindeks bersama `nisn` sebagai komposit kunci validasi).

### Model `Config` (`src/models/config.ts`)
Sistem dinamis untuk menyimpan parameter konfigurasi secara persisten.
- **`key`** (String): Nama kunci (contoh: `announcementDate`, `announcementMemo`).
- **`value`** (String): Nilai konfigurasinya (contoh: stempel waktu pengumuman atau struktur HTML dari Tiptap).

### Model `AdminSession` (`src/models/admin-session.ts`)
Digunakan untuk *session tracking* pada otentikasi area Admin.

## 5. Fitur Teknis Khusus (Deep-Dive)

### A. Fallback DNS Database (High Availability)
Pada file `src/lib/mongoose.ts`, terdapat mekanisme pemulihan cerdas ketika sistem mendeteksi error `querySrv ECONNREFUSED`. Error ini umumnya terjadi di Indonesia akibat pemblokiran atau isu routing ISP terhadap kluster MongoDB Atlas. Sistem akan melakukan *fallback* dinamis ke server DNS alternatif (misal `1.1.1.1`, `8.8.8.8`) untuk memastikan aplikasi tetap terhubung tanpa *downtime*.

### B. Countdown Penguncian Sisi Server & Klien
Pengecekan di rute `/api/graduation-result` menggunakan pendekatan pertahanan ganda:
- **Client-side** (`src/app/page.tsx`): Menampilkan countdown dan memblokir UI pengecekan jika waktu belum tiba.
- **Server-side** (`route.ts`): Secara independen membandingkan waktu saat ini dengan `announcementDate` dari database. Ini mencegah peretasan (manipulasi jam di komputer klien).

### C. Rate Limiting Terpadu
Setiap permintaan ke rute verifikasi dicatat IP-nya dan diverifikasi silang dengan utilitas pada `src/lib/rate-limit.ts`. Ini melindungi database dari ancaman eksfiltrasi atau DDOS pada jam sibuk pengumuman.

### D. Optimasi Mongoose Connection Pool
Di dalam inisialisasi Mongoose, telah disiapkan pool koneksi tinggi (`maxPoolSize: 100`, `minPoolSize: 10`) untuk memastikan server dapat menangani beban puncak (*spike traffic*) saat siswa di satu sekolah mengaksesnya dalam menit yang bersamaan saat pengumuman dibuka.
