# Fitur Tracer Study — Pengumpulan Data Alumni SMANSA

## Context

Web pengumuman kelulusan SMANSA saat ini hanya menampilkan status LULUS/TIDAK LULUS. Sekolah perlu melacak alumni (lanjut studi atau bekerja) — biasanya dilakukan manual via Google Form terpisah, yang rawan lost-funnel karena siswa sudah menutup tab setelah melihat hasil. Fitur ini memanfaatkan momen "siswa baru saja melihat LULUS" sebagai peak engagement untuk langsung mengarahkan mereka ke form tracer study, sehingga response rate jauh lebih tinggi.

**Outcome**: Alumni LULUS melihat CTA emerald di modal hasil → klik → isi form 2 langkah (data dasar auto-filled + pilihan jalur) → data tersimpan di MongoDB → admin bisa lihat/export di dashboard.

**Keputusan klarifikasi user** (sudah dijawab):
- Tombol hanya untuk status `LULUS`.
- Nama, NISN, Tahun Lulus **auto-fill readonly** (prevent typo & duplikasi).
- Upsert by NISN — boleh update data.
- Admin: tambah tab baru "Tracer Study" dengan tabel + export Excel.

## Arsitektur Keputusan Utama

1. **Dedicated page `/tracer-study/[nisn]`** (bukan modal-in-modal) — mobile real estate, navigasi lebih bersih, refresh-safe.
2. **Data passing**: `sessionStorage` menyimpan `{nisn, nama, tanggalLahir, savedAt}` sebelum navigasi. Server **selalu** re-verify via `findStudentResultByNisnAndBirthDate()` — URL NISN tidak pernah cukup untuk submit.
3. **Upsert atomic** via `findOneAndUpdate({nisn}, {...}, {upsert:true, runValidators:true})` — idempotent, aman untuk refresh/resubmit.
4. **Pagination server-side** untuk admin (unlike student CRUD yang fetch-all) — skalabel untuk data alumni multi-tahun.

## File Baru & Yang Diedit

```
src/
├── app/
│   ├── page.tsx                                  (EDIT — tambah CTA emerald + sessionStorage)
│   ├── tracer-study/[nisn]/
│   │   ├── page.tsx                              (NEW — server shell, await params)
│   │   ├── tracer-form.tsx                       (NEW — client multi-step form)
│   │   └── success-screen.tsx                    (NEW — post-submit screen)
│   ├── api/
│   │   ├── tracer-study/
│   │   │   ├── route.ts                          (NEW — POST submit)
│   │   │   └── verify/route.ts                   (NEW — POST verify + return existing)
│   │   └── admin/tracer-studies/route.ts         (NEW — GET list/export, DELETE)
│   └── admin/upload-form.tsx                     (EDIT — tab ke-3 "Tracer Study")
├── lib/tracer-study-repository.ts                (NEW — DB layer)
└── models/tracer-study.ts                        (NEW — Mongoose schema)
```

## Existing Functions/Utilities Untuk Di-reuse

- `connectToDatabase()` — `src/lib/mongoose.ts` (DNS fallback)
- `checkRateLimit(key)` — `src/lib/rate-limit.ts` (key prefix: `tracer-submit:`, `tracer-verify:`)
- `findStudentResultByNisnAndBirthDate(nisn, tanggalLahir)` — `src/lib/student-repository.ts` (re-verify NISN+birth = LULUS)
- `isCookieTokenValid(cookieHeader)` — `src/lib/admin-auth.ts` (proteksi endpoint admin)
- `getConfigModel()` — `src/models/config.ts` (baca `announcementDate` untuk derive tahun lulus)
- Pattern `getStudentModel()` force-delete-cache — `src/models/student.ts`
- Classes: `.btn-primary`, `.input-field`, `.card-official`, `.text-gradient` — `src/app/globals.css`
- GSAP easings: `expo.out` (entrance), `back.out(1.2)` (modal), `power2.in` (exit)
- Icons: Remixicon (`ri-survey-line`, `ri-edit-box-line`, `ri-graduation-cap-fill`, `ri-briefcase-fill`, `ri-check-line`, `ri-loader-4-line animate-spin`)
- `react-hot-toast` untuk feedback (`toast.success`, `toast.error`)
- `XLSX` library (sudah terinstall) untuk export: `XLSX.utils.json_to_sheet()` + `XLSX.writeFile()`

## Spesifikasi Kritikal

### Model `src/models/tracer-study.ts`

Pattern: ikuti `student.ts` (force-delete cache, `versionKey:false`). Tambahan: `timestamps:true`.

```ts
export const TRACER_PATHS = ["LANJUT_STUDI", "BEKERJA"] as const;
// Fields: nisn (unique index), nama, tahunMasuk:Number, tahunLulus:Number,
// noHp, noWa (match /^\d{10,15}$/), email (match + lowercase),
// path (enum), universitas?, jurusan?, perusahaan?, jabatan?
// Pre-validate hook: enforce conditional fields per path + tahunMasuk < tahunLulus
// Collection: "tracer_studies" (hardcode, no env override)
```

### POST `/api/tracer-study/verify` — Buka form (return student + existing submission)

- Rate limit: `checkRateLimit("tracer-verify:" + ip)`
- Validate: NISN 10 digit, tanggal YYYY-MM-DD
- `findStudentResultByNisnAndBirthDate()` → 404 jika tidak ada, 403 jika status ≠ LULUS
- Return: `{ student: {nisn, nama, status}, existing: TracerStudyDoc | null }`

### POST `/api/tracer-study` — Submit

- Rate limit: `checkRateLimit("tracer-submit:" + ip)`
- Full server-side validation (mirror client & model):
  - Phone regex `^\d{10,15}$`, email regex, tahunMasuk 2000-2100 < tahunLulus
  - path enum, conditional fields min 2 chars
- **Critical**: re-run `findStudentResultByNisnAndBirthDate()` dengan tanggalLahir dari body — reject jika student tidak ada atau bukan LULUS
- Snapshot `nama` dari student (bukan dari client), hindari spoofing
- `upsertTracerStudy(...)` dengan `findOneAndUpdate({nisn}, {$set}, {upsert:true, runValidators:true, setDefaultsOnInsert:true})`

### GET/DELETE `/api/admin/tracer-studies`

- Auth: `isCookieTokenValid(request.headers.get("cookie"))` di tiap method
- GET: query params `page`, `limit` (max 100), `search`. `export=1` → return semua (unpaginated) untuk XLSX client-side
- Search: regex on `nama` (case-insensitive) OR prefix on `nisn` — escape special chars
- DELETE: `?id=...`

### Edit `src/app/page.tsx`

Di dalam modal kelulusan (antara memo dan tombol KEMBALI), conditional render CTA emerald **hanya jika `result?.status === "LULUS"`**:

```tsx
{result?.status === "LULUS" && (
  <div className="mb-4 md:mb-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 p-4 md:p-5 text-left relative overflow-hidden">
    {/* Icon pulsing + judul + deskripsi */}
    <Link href={`/tracer-study/${result.nisn}`} className="...bg-emerald-500...">
      <i className="ri-edit-box-line" /> Isi Tracer Study
    </Link>
  </div>
)}
```

Di `handleSubmit` setelah `setResult(payload)` sukses dengan LULUS:
```ts
if (payload.status === "LULUS") {
  sessionStorage.setItem("tracerStudyPrefill", JSON.stringify({
    nisn: payload.nisn, nama: payload.nama, tanggalLahir, savedAt: Date.now(),
  }));
}
```

### Form Multi-Step `tracer-form.tsx`

- `"use client"`, 1 file (~400 lines), sub-components colocated
- Boot flow: baca sessionStorage → panggil `/api/tracer-study/verify` → jika ada `existing`, prefill semua fields (re-edit mode)
- Fetch `/api/config` untuk derive `tahunLulus = new Date(announcementDate).getFullYear()`
- State: `FormState` (semua field), `step: 1|2`, `errors: Record<string,string>`, `verifying/verifyError/submitted`
- **Stepper**: 2 lingkaran (primary/emerald/zinc) dengan connector line, check icon saat done
- **Step 1**: readonly (zinc-50 bg + lock icon) untuk nama/nisn/tahunLulus. Input: tahunMasuk (number), noHp/noWa (digits-only onChange filter), email
- **Step 2**: 2 card besar (grid-cols-1 md:grid-cols-2) untuk pilihan jalur. Click → highlight dengan border primary + scale-[1.02] + bg-primary/5 + shadow. Conditional fields slide in dengan GSAP
- **Nav**: Step 1 [Selanjutnya →], Step 2 [← Kembali] [Kirim Data]
- **Transisi step**: GSAP `x:-30 → 0` (masuk) atau `x:0 → -30` (keluar) dengan `onComplete:setStep`
- **Validasi** inline dengan error text merah di bawah field (pakai style `.animate-shake` bila mau — catatan: class tsb dipakai di page.tsx existing tapi TIDAK terdefinisi di globals.css; aman pakai Tailwind built-in `animate-pulse` saja atau tambah keyframe di globals.css)
- **Submit**: POST → toast → set `submitted: true` → render `<SuccessScreen />` → clear sessionStorage

### Edit `src/app/admin/upload-form.tsx`

- Extend tab enum: `"portal" | "database" | "tracer"`
- Tambah sidebar/mobile nav item (icon `ri-survey-fill` atau `ri-user-location-fill`)
- State baru: `tracerData`, `tracerTotal`, `tracerPage`, `tracerSearch`, `tracerLoading`, `isExporting`, `tracerDeleteTarget`
- Debounced fetch: `setTimeout(fetchTracers, 300)` saat `activeTab==='tracer'`, page, atau search berubah
- Tabel: No | Nama | NISN | Badge Jalur | Tahun Masuk | Tahun Lulus | Tgl Submit | Aksi (expand detail eye + delete)
- Expand row menampilkan HP/WA/Email + universitas/jurusan atau perusahaan/jabatan
- Pagination ikut totalPages dari server
- Export button: fetch `?export=1` → `XLSX.utils.json_to_sheet(rows)` → `writeFile(wb, "tracer-study-YYYY-MM-DD.xlsx")`
- Delete: extend existing `deleteTarget` union dengan `{type:'tracer', id, name}`, route ke `/api/admin/tracer-studies?id=...`

## Urutan Implementasi

1. **Model** — `src/models/tracer-study.ts`
2. **Repository** — `src/lib/tracer-study-repository.ts` (upsert, findByNisn, list paginated, delete, findAllForExport)
3. **API verify** — `src/app/api/tracer-study/verify/route.ts`
4. **API submit** — `src/app/api/tracer-study/route.ts`
5. **Form page + tracer-form + success-screen** — `src/app/tracer-study/[nisn]/*`
6. **CTA di page.tsx** — edit `src/app/page.tsx`
7. **API admin** — `src/app/api/admin/tracer-studies/route.ts`
8. **Tab admin** — edit `src/app/admin/upload-form.tsx`

## Risiko & Mitigasi Utama

- **NISN spoofing di URL** → server re-verify `nisn + tanggalLahir + status=LULUS` di setiap read/write. URL saja tidak cukup.
- **Direct URL access tanpa sessionStorage** → verify fail → friendly error screen dengan link ke home.
- **Next.js 16 async params** → `const { nisn } = await params` di `page.tsx` (sama seperti `cookies()` di admin/config).
- **Mongoose cache stale saat hot-reload** → gunakan force-delete pattern dari `student.ts`.
- **XSS dari text input** → React auto-escape. Export XLSX: values biasa (bukan formulas), jika cemas prefix `'` ke sel yang mulai dengan `=/+/-/@`.
- **sessionStorage expiry** → cek `savedAt` > 30 menit → minta user cek kelulusan ulang.

## Verifikasi End-to-End

1. `pnpm dev`, admin set announcement date ke masa lalu.
2. Cek kelulusan siswa LULUS → modal muncul → verify CTA emerald tampil.
3. Klik CTA → navigasi ke `/tracer-study/{nisn}` → loading → form render.
4. Verify Step 1 readonly fields (nama, nisn, tahunLulus).
5. Kosongkan tahunMasuk → Selanjutnya → error inline.
6. Isi valid → Selanjutnya → animasi transisi + stepper update.
7. Klik "Lanjut Studi" card → highlight + conditional fields slide in.
8. Toggle ke "Bekerja" → field sebelumnya hilang, field baru muncul.
9. Submit → toast success → success screen.
10. Cek MongoDB collection `tracer_studies` — 1 dokumen dengan timestamps.
11. Akses ulang `/tracer-study/{nisn}` → form prefilled dengan data existing.
12. Edit + submit → `updatedAt` berubah, `createdAt` sama.
13. Siswa TIDAK LULUS → CTA TIDAK muncul di modal.
14. Direct visit `/tracer-study/9999999999` tanpa session → error screen dengan link home.
15. Edit sessionStorage (wrong tanggalLahir) → visit form → verify endpoint return 404.
16. Admin login → klik tab "Tracer Study" → tabel load paginated.
17. Search by nama partial (debounced 300ms) → hasil filter.
18. Next page → pagination OK.
19. Click delete → confirm → record hilang.
20. Export → xlsx terunduh dengan semua kolom.
21. Spam POST `/api/tracer-study` × 11 → call ke-11 return 429.
22. `pnpm lint` → zero errors.
23. `pnpm build` → production build passes.
