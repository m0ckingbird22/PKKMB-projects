# PRD — Sistem Registrasi & Absensi PKKMB
**Universitas Cakrawala**
**Versi:** 2.0
**Tanggal:** Juni 2025
**Divisi:** Registrasi PKKMB
**Status:** Draft

---

## 1. Latar Belakang

PKKMB (Pengenalan Kehidupan Kampus bagi Mahasiswa Baru) Universitas Cakrawala diikuti oleh ribuan mahasiswa baru dari 16 program studi yang berlangsung selama 6 hari. Divisi Registrasi bertanggung jawab mengelola data kehadiran dan feedback seluruh peserta.

PKKMB dilaksanakan secara **hybrid** — mahasiswa dapat hadir secara fisik (offline) maupun mengikuti via Zoom (online). Keduanya tetap diwajibkan mengisi absensi dengan bukti foto.

Selama ini pengelolaan data dilakukan secara manual atau menggunakan tools generik seperti Google Forms, yang memiliki berbagai keterbatasan untuk skala dan kebutuhan spesifik PKKMB.

---

## 2. Problem Statement

| # | Masalah | Dampak |
|---|---------|--------|
| 1 | Absensi manual atau form statis mudah dititipkan | Data kehadiran tidak valid |
| 2 | Tidak ada validasi mahasiswa terdaftar | Data bisa diisi sembarang orang |
| 3 | Rekap kehadiran ribuan mahasiswa dari 16 prodi dilakukan manual | Lambat, rawan human error |
| 4 | Tidak ada bukti fisik kehadiran | Sulit verifikasi kalau ada dispute |
| 5 | Laporan untuk pimpinan harus dibuat manual | Tidak efisien untuk 8 panitia |
| 6 | Tidak ada pembeda data kehadiran offline vs online | Rekap tidak akurat untuk evaluasi |

---

## 3. Kenapa Bukan Google Forms?

> Ini pertanyaan yang valid — GForm gratis, mudah, dan tidak perlu coding. Tapi ada batasan fundamental yang tidak bisa diatasi.

| Fitur | Google Forms | Sistem Custom |
|-------|-------------|---------------|
| Link absensi bisa di-screenshot & disebarkan | ✅ Bisa disalahgunakan | ❌ QR berbeda tiap hari |
| Double submit oleh orang yang sama | ✅ Bisa terjadi | ❌ Dicegah di database level |
| Validasi NIM terdaftar secara realtime | ❌ Tidak bisa | ✅ Cek ke database mahasiswa |
| Bukti foto kehadiran wajib | ❌ Tidak ada | ✅ Upload foto mandatory |
| Background khusus sebagai bukti fisik per hari | ❌ Tidak ada | ✅ Ketentuan foto terintegrasi di form |
| Pembeda mode kehadiran offline vs online | ❌ Tidak ada | ✅ Field mode di form absensi |
| Dashboard rekap realtime per prodi | ❌ Perlu formula GSheet manual | ✅ Otomatis & realtime |
| Flag absensi mencurigakan | ❌ Tidak ada | ✅ Panitia bisa review & batalkan |
| Input manual oleh panitia (tanpa HP) | ❌ Tidak ada | ✅ Fitur input manual built-in |
| Export laporan siap serah ke rektorat | ❌ Perlu format ulang manual | ✅ One-click export Excel |
| Biaya | Gratis | Gratis (free tier) |

**Kesimpulan:** GForm cocok untuk survei sederhana. Untuk absensi ribuan mahasiswa dengan kebutuhan validasi, anti-fraud, dan hybrid mode, dibutuhkan sistem custom.

---

## 4. Tujuan Sistem

1. Mempercepat dan mengotomasi proses absensi 6 hari PKKMB
2. Mencegah praktik titip absen melalui mekanisme QR + bukti foto berlapis
3. Mengelola kehadiran hybrid (offline & online) dalam satu sistem
4. Memberikan dashboard real-time kepada panitia registrasi
5. Menghasilkan laporan kehadiran dan feedback siap serah ke pimpinan
6. Mengurangi beban kerja manual 8 panitia divisi registrasi

---

## 5. Pengguna Sistem

| Role | Deskripsi | Akses |
|------|-----------|-------|
| **Admin** | Koordinator divisi registrasi | Full access — kelola data, generate QR, export laporan, batalkan absensi |
| **Panitia** | Anggota divisi registrasi (8 orang) | Dashboard, review foto, flag absensi, input manual |
| **Mahasiswa** | Peserta PKKMB (ribuan) | Scan QR → isi form absensi & feedback (tanpa akun) |

---

## 6. Fitur & Spesifikasi

### 6.1 Modul Registrasi Mahasiswa

**F01 — Import Data via Excel/CSV**
- Admin dapat upload file Excel/CSV berisi data mahasiswa
- Sistem menampilkan preview data sebelum di-commit ke database
- Validasi otomatis: deteksi NIM duplikat, prodi tidak valid, kolom kosong
- Jika ada error, sistem menampilkan baris yang bermasalah sebelum import

**F02 — Manajemen Data Mahasiswa**
- CRUD (tambah, lihat, edit, hapus) data mahasiswa secara manual
- Filter berdasarkan prodi (16 prodi)
- Search berdasarkan NIM atau nama
- Data yang tersimpan: NIM, nama lengkap, prodi, email (opsional)

---

### 6.2 Modul Auth & Akses

**F03 — Login Panitia**
- Login menggunakan email + password
- Hanya akun yang didaftarkan admin yang bisa masuk
- Session management (auto logout setelah X jam)

**F04 — Role Management**
- Role **Admin**: akses penuh termasuk kelola akun panitia & batalkan absensi
- Role **Panitia**: akses dashboard, review foto, flag absensi, input manual — tidak bisa hapus data master
- Halaman absensi mahasiswa tidak memerlukan akun (public, dilindungi validasi token QR)

---

### 6.3 Modul Absensi (Core Feature)

**F05 — Generate QR Per Hari**
- Admin/panitia generate 1 QR unik per hari (hari 1–6)
- QR bersifat tetap sepanjang hari (tidak expire tiap 30 detik)
- QR ditampilkan di tablet/layar di area pintu masuk
- QR berbeda setiap harinya untuk mencegah penggunaan foto lama

**F06 — Form Absensi Mahasiswa**
- Setelah scan QR, mahasiswa diarahkan ke form absensi
- Form berisi:
  - Input NIM (wajib) — nama & prodi muncul otomatis setelah NIM diketik
  - Pilihan mode kehadiran (wajib): **Offline** atau **Online**
  - Upload foto (wajib) — diambil langsung dari kamera, bukan galeri
- Ketentuan foto berdasarkan mode:
  - **Offline** → foto selfie di depan background fisik PKKMB hari ke-X
  - **Online** → foto screenshot tampilan Zoom meeting yang sedang berjalan
- Jika NIM tidak terdaftar → ditolak
- Jika sudah absen hari ini → ditolak (anti double submit)

**F07 — Anti Double Submit**
- Satu NIM hanya bisa submit 1x per hari
- Validasi dilakukan di level database (unique constraint)
- Jika mencoba submit ulang → tampilkan pesan "Kamu sudah absen hari ini"

**F08 — Input Manual oleh Panitia**
- Untuk mahasiswa yang tidak memiliki HP atau mengalami kendala teknis
- Panitia input NIM + pilih mode + upload foto (diambil panitia) via dashboard
- Tercatat sebagai absensi normal di database
- Cadangan fisik: panitia tetap siapkan kertas untuk pencatatan darurat

---

### 6.4 Modul Dashboard Panitia

**F09 — Rekap Real-time**
- Total hadir vs total mahasiswa per hari
- Breakdown per prodi: hadir / total
- Breakdown mode: offline vs online
- Update otomatis tanpa perlu refresh halaman

**F10 — Review Foto Bukti**
- Panitia bisa lihat semua foto yang masuk per hari
- Tampilan grid foto — anomali (foto tanpa background PKKMB atau screenshot Zoom palsu) langsung terlihat tanpa perlu review satu per satu
- Filter per hari, per prodi, per mode (offline/online)

**F11 — Flag & Batalkan Absensi**
- Panitia bisa menandai absensi mencurigakan sebagai "flagged" beserta alasan
- Admin bisa batalkan absensi yang terbukti fraud
- Semua aksi tercatat (audit log: siapa, kapan, alasan)

---

### 6.5 Anti Fraud (3 Lapis)

| Lapis | Mekanisme | Yang Dicegah |
|-------|-----------|-------------|
| 1 | QR berbeda tiap hari | Foto hari ke-1 tidak bisa dipakai absen hari ke-2 |
| 2 | Foto wajib di depan background fisik PKKMB per hari | Tidak bisa foto dari luar venue |
| 3 | Panitia jaga pintu masuk secara fisik | Human gate terakhir sebelum masuk gedung |

**Ketentuan Background Fisik:**
- Background resmi PKKMB ditempatkan di area antrian pintu masuk
- Background berbeda tiap hari (warna + label "HARI 1", "HARI 2", dst)
- Tanggung jawab penyediaan background: *(dikonfirmasi ke panitia)*

---

### 6.6 Modul Feedback

**F12 — Form Feedback Harian**
- Form feedback dibuka setelah sesi absensi ditutup
- Mahasiswa isi berdasarkan NIM (tanpa akun)
- Field:
  - Rating per kategori (1–5 bintang) — wajib
  - Kategori: Materi, Panitia, Fasilitas, Konsumsi
  - Komentar teks bebas — opsional
- Tampilan di dashboard: anonim (nama tidak ditampilkan)
- Satu mahasiswa hanya bisa submit 1x per hari per kategori

**F13 — Agregasi Feedback**
- Dashboard menampilkan rata-rata rating per kategori per hari
- Grafik tren rating dari hari ke hari
- Komentar teks ditampilkan sebagai daftar (tanpa nama)

---

### 6.7 Modul Laporan & Export

**F14 — Export Rekap Kehadiran**
- Export Excel: semua mahasiswa, kehadiran per hari (✅/❌), mode (offline/online), total hadir
- Bisa filter per prodi sebelum export
- Format siap serah ke dekan/rektorat

**F15 — Export Rekap Feedback**
- Export Excel: rata-rata rating per hari, per kategori
- Komentar teks disertakan di sheet terpisah

**F16 — Riwayat Per Mahasiswa**
- Lihat detail kehadiran 6 hari per mahasiswa
- Lengkap dengan foto bukti, mode kehadiran, dan timestamp per hari

---

## 7. Flow Utama: Absensi

```
[SETUP — Sebelum Hari H]
Admin import data mahasiswa via Excel
        ↓
Sistem validasi & simpan ke database
        ↓
Admin generate 1 QR untuk hari ke-X
        ↓
[HARI H — Di Pintu Masuk]
Background fisik PKKMB hari ke-X dipasang di area antrian
QR ditampilkan di tablet/layar pintu masuk
        ↓
[MAHASISWA DATANG — OFFLINE]
Mahasiswa foto selfie di depan background hari ke-X
        ↓
Scan QR → buka form absensi
        ↓
Input NIM → nama & prodi muncul otomatis
Pilih mode: Offline
Upload foto → Submit
        ↓
[MAHASISWA — ONLINE]
Mahasiswa scan QR dari rumah
        ↓
Input NIM → nama & prodi muncul otomatis
Pilih mode: Online
Upload screenshot Zoom → Submit
        ↓
[VALIDASI SISTEM]
  ├── NIM tidak terdaftar?      → TOLAK
  ├── Sudah absen hari ini?     → TOLAK
  └── Semua valid?              → SIMPAN ✅
        ↓
[PANITIA PINTU — OFFLINE]
Lihat konfirmasi di layar:
  ✅ Andi Pratama — TI — Offline → BOLEH MASUK
  ❌ Gagal validasi              → TAHAN DULU
        ↓
[MAHASISWA TANPA HP]
Panitia catat di kertas → input manual via dashboard
        ↓
[AKHIR HARI]
Dashboard rekap otomatis tersedia
Export Excel rekap kehadiran hari ini
```

---

## 8. API Endpoints

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| POST | `/api/auth/login` | Public | Login panitia |
| GET | `/api/students` | Panitia | List mahasiswa + filter + search |
| POST | `/api/students` | Admin | Tambah mahasiswa manual |
| GET | `/api/students/[id]` | Panitia | Detail mahasiswa |
| PUT | `/api/students/[id]` | Admin | Edit mahasiswa |
| DELETE | `/api/students/[id]` | Admin | Hapus mahasiswa |
| POST | `/api/students/import` | Admin | Import Excel/CSV |
| POST | `/api/qr` | Admin | Generate QR per hari |
| GET | `/api/qr/[token]` | Public | Validasi token QR |
| POST | `/api/attendance/submit` | Public | Submit absensi (mahasiswa) |
| POST | `/api/attendance/manual` | Panitia | Input manual (panitia) |
| GET | `/api/attendance` | Panitia | Rekap absensi + filter |
| PUT | `/api/attendance/[id]/flag` | Panitia | Flag absensi mencurigakan |
| DELETE | `/api/attendance/[id]` | Admin | Batalkan absensi |
| POST | `/api/feedback` | Public | Submit feedback (mahasiswa) |
| GET | `/api/feedback` | Panitia | Rekap & agregasi feedback |
| GET | `/api/export/attendance` | Admin | Export Excel kehadiran |
| GET | `/api/export/feedback` | Admin | Export Excel feedback |

---

## 9. Data Model

```sql
-- Master prodi
CREATE TABLE prodi (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode       VARCHAR(10) UNIQUE NOT NULL,
  nama       VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Data mahasiswa peserta PKKMB
CREATE TABLE students (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nim        VARCHAR(20) UNIQUE NOT NULL,
  nama       VARCHAR(100) NOT NULL,
  prodi_id   UUID NOT NULL REFERENCES prodi(id),
  email      VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Akun panitia (terintegrasi Supabase Auth)
CREATE TABLE panitia (
  id         UUID PRIMARY KEY REFERENCES auth.users(id),
  nama       VARCHAR(100) NOT NULL,
  email      VARCHAR(100) UNIQUE NOT NULL,
  role       VARCHAR(10) NOT NULL DEFAULT 'panitia', -- 'admin' | 'panitia'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- QR sesi per hari
CREATE TABLE qr_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day        INTEGER NOT NULL CHECK (day BETWEEN 1 AND 6),
  token      VARCHAR(64) UNIQUE NOT NULL,
  is_active  BOOLEAN DEFAULT true,
  created_by UUID REFERENCES panitia(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (day)
);

-- Rekap absensi mahasiswa
CREATE TABLE attendance (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES students(id),
  day          INTEGER NOT NULL CHECK (day BETWEEN 1 AND 6),
  mode         VARCHAR(10) NOT NULL CHECK (mode IN ('offline', 'online')),
  foto_url     TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  input_by     UUID REFERENCES panitia(id), -- NULL jika mahasiswa sendiri
  is_flagged   BOOLEAN DEFAULT false,
  flagged_by   UUID REFERENCES panitia(id),
  flagged_at   TIMESTAMPTZ,
  flag_reason  TEXT,
  UNIQUE (student_id, day)
);

-- Feedback harian mahasiswa
CREATE TABLE feedback (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES students(id),
  day          INTEGER NOT NULL CHECK (day BETWEEN 1 AND 6),
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  kategori     VARCHAR(20) NOT NULL CHECK (kategori IN ('materi','panitia','fasilitas','konsumsi')),
  komentar     TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (student_id, day, kategori)
);

-- Index untuk performa query
CREATE INDEX idx_students_nim ON students(nim);
CREATE INDEX idx_students_prodi ON students(prodi_id);
CREATE INDEX idx_attendance_day ON attendance(day);
CREATE INDEX idx_attendance_student_day ON attendance(student_id, day);
CREATE INDEX idx_feedback_day ON feedback(day);
```

**Supabase Storage Structure:**
```
Bucket: pkkmb-photos
└── attendance/
    ├── hari-1/
    │   └── {student_id}.jpg
    ├── hari-2/
    │   └── {student_id}.jpg
    └── hari-6/
        └── {student_id}.jpg
```

---

## 10. Tech Stack

| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| Frontend + Backend | Next.js 14 (App Router) | Familiar, fullstack dalam 1 repo |
| Database | Supabase (PostgreSQL) | Free tier, realtime subscription built-in |
| Auth | Supabase Auth | Terintegrasi, tidak perlu setup manual |
| Storage Foto | Supabase Storage | Free 1GB, cukup dengan kompresi foto |
| QR Generator | library `qrcode` | Generate QR di server |
| Import Excel | library `xlsx` (SheetJS) | Parse file Excel/CSV |
| Export Excel | library `xlsx` (SheetJS) | Generate file Excel laporan |
| Deployment | Vercel | Free tier, deploy otomatis dari GitHub |

---

## 11. Estimasi Biaya

| Komponen | Biaya |
|----------|-------|
| Database (Supabase free tier) | Rp 0 |
| Hosting (Vercel free tier) | Rp 0 |
| Storage foto (Supabase + kompresi ~150KB/foto) | Rp 0 |
| Domain custom (opsional) | ~Rp 100.000–150.000/tahun |
| **Total** | **Rp 0 – Rp 150.000** |

> Estimasi storage: 2.000 mahasiswa × 6 hari × 150KB = ±1.8GB
> Solusi: kompresi foto di sisi browser sebelum upload → target < 150KB per foto → total ±900MB → dalam free tier 1GB Supabase ✅

---

## 12. Timeline Development

| Minggu | Target |
|--------|--------|
| Minggu 1 | Setup project, auth panitia, import Excel, CRUD mahasiswa |
| Minggu 2 | QR system per hari, form absensi (NIM + mode + foto), anti double submit |
| Minggu 3 | Input manual panitia, dashboard realtime, review foto, flag absensi |
| Minggu 4 | Feedback system, export Excel laporan |
| Minggu 5 | Testing end-to-end, bug fix, deploy ke Vercel |
| Buffer | 1–2 minggu sebelum September untuk revisi berdasarkan feedback panitia |

---

## 13. Hal yang Masih Perlu Dikonfirmasi ke Panitia

- [ ] Konsekuensi mahasiswa yang tidak hadir (sanksi / tidak lulus ospek?)
- [ ] Tanggal pasti pelaksanaan PKKMB September
- [ ] Jumlah pasti mahasiswa baru tahun ini
- [ ] Daftar lengkap 16 program studi beserta kodenya
- [ ] Apakah ada sesi pagi dan siang (atau 1 sesi per hari)?
- [ ] Siapa yang bertanggung jawab sebagai admin utama sistem?
- [ ] Siapa yang bertanggung jawab menyiapkan background fisik per hari di pintu masuk?
- [ ] Berapa pintu masuk yang akan dijaga panitia?
- [ ] Link Zoom per hari disediakan oleh divisi mana? (untuk koordinasi)

---

*Dokumen ini akan diperbarui seiring berjalannya koordinasi dengan panitia PKKMB.*
