# PKKMB System — Universitas Cakrawala

Sistem registrasi dan absensi digital untuk **PKKMB (Pengenalan Kehidupan Kampus bagi Mahasiswa Baru)** Universitas Cakrawala. Dibangun untuk mengelola kehadiran ±1.500 mahasiswa baru dari 16 program studi selama **6 hari** event, dengan mode hybrid (offline & online).

Dokumen ini adalah referensi lengkap: arsitektur, setup, skema database, keamanan, API, dan catatan operasional. Ditulis ulang per **Agustus 2026** — versi sebelumnya sudah tidak sesuai kode (nama tabel, kolom NIM, dan fitur export sudah berubah).

---

## Daftar Isi

1. [Gambaran Sistem](#1-gambaran-sistem)
2. [Tech Stack](#2-tech-stack)
3. [Struktur Direktori](#3-struktur-direktori)
4. [Fitur per Halaman](#4-fitur-per-halaman)
5. [Setup & Instalasi](#5-setup--instalasi)
6. [Environment Variables](#6-environment-variables)
7. [Database Schema](#7-database-schema)
8. [Keamanan & Model Akses](#8-keamanan--model-akses)
9. [API Reference](#9-api-reference)
10. [Aturan Bisnis & Anti-Fraud](#10-aturan-bisnis--anti-fraud)
11. [Catatan Teknis Penting (Gotchas)](#11-catatan-teknis-penting-gotchas)
12. [Design System](#12-design-system)
13. [Deployment](#13-deployment)
14. [Runbook Hari-H (Operasional Panitia)](#14-runbook-hari-h-operasional-panitia)
15. [Keterbatasan & Rencana](#15-keterbatasan--rencana)

---

## 1. Gambaran Sistem

Alur inti sistem adalah **satu lingkaran QR per hari**:

```
┌─────────────┐   buat sesi    ┌──────────────────┐
│  PANITIA    │ ─────────────► │  qr_session      │  token unik per hari+tipe
│ (dashboard) │                │  (aktif/nonaktif) │
└─────────────┘                └────────┬─────────┘
     ▲                                  │ ditampilkan sebagai QR code
     │ realtime refresh                 ▼
     │                        ┌──────────────────┐
     │                        │  MAHASISWA       │  scan QR dari HP
     │                        │  /absensi/[token]│  (tanpa login)
     │                        │  /feedback/[token]│
     │                        └────────┬─────────┘
     │                                 │ submit
     │                                 ▼
┌────┴──────────┐   insert      ┌──────────────────┐
│  attendance   │ ◄──────────── │  API routes      │  validasi token,
│  feedback     │               │  (server-side)   │  foto, duplikat
└───────────────┘               └────────┬─────────┘
                                         │ foto bukti
                                         ▼
                               ┌──────────────────┐
                               │ Supabase Storage │  bucket `pkkmb-photos`
                               └──────────────────┘
```

**Prinsip desain:**

- Halaman mahasiswa **publik tanpa login** — keamanan datang dari QR token harian + validasi server, bukan akun per mahasiswa.
- Semua penulisan data dari form publik dilakukan di **API route (server)** memakai service role — client tidak pernah pegang kunci istimewa.
- Dashboard panitia **realtime**: angka statistik di-refresh otomatis saat ada insert attendance/feedback/perubahan sesi QR.

---

## 2. Tech Stack

| Layer        | Teknologi                                        |
| ------------ | ------------------------------------------------ |
| Framework    | Next.js 14 (App Router) + TypeScript             |
| Database     | Supabase (PostgreSQL) + RLS                      |
| Auth         | Supabase Auth (`@supabase/ssr`, cookie-based)    |
| Storage      | Supabase Storage — bucket `pkkmb-photos`         |
| Realtime     | Supabase Realtime (`postgres_changes`)           |
| Styling      | Tailwind CSS (palet brand custom)                |
| Icons        | lucide-react                                     |
| QR           | `qrcode.react` (SVG)                             |
| PDF Export   | `jspdf` + `jspdf-autotable`                      |
| Toast        | `react-hot-toast`                                |
| Font         | Montserrat (`next/font`)                         |
| Deployment   | Vercel                                           |

> Catatan: `xlsx` ada di dependencies tetapi saat ini **belum dipakai** — export laporan berjalan lewat PDF. `@tanstack/react-query` juga terpasang; dipakai terbatas di view reports.

---

## 3. Struktur Direktori

```
pkkmb-system/
├── app/
│   ├── layout.tsx                     # Root layout (Montserrat, metadata)
│   ├── login/page.tsx                 # Login panitia (Supabase Auth)
│   │
│   ├── absensi/[token]/               # PUBLIK — form absensi mahasiswa
│   │   ├── page.tsx                   #   validasi token, render form
│   │   └── absensi-form.tsx           #   client: search nama, kamera, submit
│   │
│   ├── feedback/[token]/              # PUBLIK — form feedback mahasiswa
│   │   ├── page.tsx                   #   validasi token + type feedback
│   │   └── feedback-form.tsx          #   client: 6 pertanyaan Likert
│   │
│   ├── dashboard/                     # PROTEKSI LOGIN (middleware + layout)
│   │   ├── layout.tsx                 #   cek x-user-id + lookup tabel panitia
│   │   ├── page.tsx                   #   statistik realtime hari ini
│   │   ├── _components/               #   dashboard-view (client, realtime)
│   │   ├── students/                  #   data mahasiswa + filter + pagination
│   │   ├── qr/                        #   QR manager (buat/akhiri/hapus sesi)
│   │   ├── attendance/                #   rekap absensi + foto + flag
│   │   ├── feedback/                  #   rekap feedback harian
│   │   └── reports/                   #   laporan per prodi + export PDF
│   │
│   └── api/                           # Server-only (detail di §9)
│       ├── qr/route.ts                #   POST   buat sesi
│       ├── qr/[id]/route.ts           #   PATCH  akhiri sesi
│       ├── qr/history/route.ts        #   DELETE hapus riwayat sesi nonaktif
│       ├── attendance/submit/route.ts #   POST   submit absensi + foto (publik)
│       ├── attendance/[id]/flag/…     #   PATCH  flag/unflag absensi
│       ├── feedback/submit/route.ts   #   POST   submit feedback (publik)
│       └── students/search/route.ts   #   GET    cari mahasiswa (publik)
│
├── components/
│   ├── dashboard/                     # sidebar, shell, day-picker, auto-logout
│   └── attendance/                    # stat-cards, tabel & grid prodi
│
├── lib/
│   ├── supabase-client.ts             # Browser client (anon key)
│   ├── supabase-server.ts             # SSR client (anon key) + getUserIdFromHeader()
│   ├── supabase-admin.ts              # Service-role client — SERVER ONLY
│   ├── database.types.ts              # Tipe hasil `supabase gen types`
│   └── types.ts
│
├── scripts/
│   ├── seed_mahasiswa.py              # Import mahasiswa dari Excel → Supabase
│   ├── requirements.txt               # openpyxl, supabase
│   └── data/                          # File Excel sumber (jangan commit kredensial)
│
├── supabase/
│   └── seed-database.sql              # Setup lengkap: tabel, constraint, index, RLS
│
├── middleware.ts                      # Auth refresh + proteksi route + inject header
└── tailwind.config.ts                 # Palet brand: ember / twilight / inferno
```

---

## 4. Fitur per Halaman

### Publik (mahasiswa, tanpa login)

| Halaman | Fitur |
| --- | --- |
| `/absensi/[token]` | Validasi token QR (aktif?). Search nama (debounce 300ms, ilike `nama_normalized`, maks 10 hasil, yang sudah absen otomatis tidak muncul). Mode offline/online. Foto wajib: kamera depan (mirror) atau galeri, maks 5 MB. |
| `/feedback/[token]` | Validasi token + **harus bertipe feedback**. 6 pertanyaan Likert 1–5 (STS s/d SS), kelebihan & saran opsional. Yang sudah mengisi tidak muncul di pencarian. |

### Dashboard (panitia, wajib login)

| Halaman | Fitur |
| --- | --- |
| `/dashboard` | Statistik hari terpilih (total/hadir/belum/%/feedback), top-3 prodi kehadiran terendah, timeline aktivitas terbaru (absensi+feedback+sesi QR), **auto-refresh realtime**. |
| `/dashboard/students` | Daftar mahasiswa: search nama/email, filter prodi, pagination 20/halaman, hitung total. |
| `/dashboard/qr` | Buat sesi (tipe absensi/feedback × hari 1–6), QR SVG siap proyektor/di-print, akhiri sesi, hapus semua riwayat sesi nonaktif. |
| `/dashboard/attendance` | Pilih hari → statistik, daftar kehadiran, foto bukti, **flag absensi mencurigakan** (+alasan) dan unflag. |
| `/dashboard/feedback` | Pilih hari → agregat rating per pertanyaan + komentar kelebihan/saran. |
| `/dashboard/reports` | Pilih hari & prodi → rekap per prodi, daftar belum hadir, **export PDF** (jsPDF + autoTable). |

### Fitur lintas halaman

- **Auto-logout** — idle 5 menit tanpa aktivitas mouse/keyboard/touch → signOut otomatis (komputer panitia di ruang terbuka tidak tertinggal login).
- **Sidebar responsif** — collapse di desktop, drawer di mobile.
- **Pemilih hari 1–6** konsisten di semua halaman via query param `?day=`.

---

## 5. Setup & Instalasi

### Prasyarat

- Node.js 18+ dan npm
- Akun Supabase (buat project baru)
- Python 3 (hanya untuk import data mahasiswa awal)

### Langkah

**1. Clone & install**

```bash
git clone <url-repo>
cd pkkmb-system
npm install
```

**2. Environment variables** — buat `.env.local` di root (lihat §6 untuk nilai lengkap).

**3. Setup database** — buka Supabase Dashboard → **SQL Editor** → paste seluruh isi `supabase/seed-database.sql` → Run.

File ini **idempotent** (aman dijalankan berulang): `CREATE TABLE IF NOT EXISTS`, constraint lewat `DO $$ … EXCEPTION WHEN duplicate_object`, dan `DROP POLICY IF EXISTS` sebelum `CREATE POLICY`.

**4. Buat storage bucket** (manual, tidak ada di SQL):
Supabase Dashboard → **Storage** → New bucket:

- Nama: `pkkmb-photos`
- **Public bucket: ON** (foto absensi dibaca via public URL di dashboard)

**5. Aktifkan Realtime** untuk tabel yang dipantau dashboard:
Supabase Dashboard → Database → Publications → `supabase_realtime` → centang `attendance`, `feedback`, `qr_session`.
*Tanpa langkah ini dashboard tetap jalan, tapi statistik tidak auto-refresh.*

**6. Verifikasi policy baca `qr_session` untuk anon** — halaman publik `/absensi/[token]` membaca `qr_session` memakai anon key. Pastikan ada policy SELECT untuk `anon` (cek: `SELECT * FROM pg_policies WHERE tablename = 'qr_session';`). Kalau belum ada, tambahkan:

```sql
CREATE POLICY "qr_session_read_anon" ON qr_session
FOR SELECT TO anon USING (true);
```

*Gejala kalau tidak ada: semua QR dianggap "TIDAK VALID" oleh mahasiswa yang tidak login.*

**7. Buat akun panitia pertama**:

1. Supabase → Authentication → Users → **Add user** (email + password).
2. Insert baris di tabel `panitia` dengan `id` = UUID user tersebut:

```sql
INSERT INTO panitia (id, email, nama, role)
VALUES ('<uuid-dari-auth-users>', 'email@panitia.com', 'Nama Panitia', 'admin');
```

> Login memakai Supabase Auth; tabel `panitia` hanya data pelengkap (nama, role) yang dipetakan berdasarkan `id`/`email` yang sama. Tanpa baris di tabel ini, user akan ditolak di dashboard (`403` / redirect login).

**8. Import data mahasiswa** dari Excel daftar ulang:

```bash
cd scripts
pip install -r requirements.txt
export SUPABASE_URL="https://<project-ref>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
python seed_mahasiswa.py
```

Script membaca `data/Pembagian_Kelompok_SPARK_SIC_Sept_2026.xlsx`, memetakan 16 prodi (kode `ACC, AI, CS, DS, DB, DKV, FIN, IKOM, IS, LAW, MGT, PGSD, PSY, TE, TI, TLRB`), menormalkan nama ke `nama_normalized`, dan menolak baris berstatus `cancel`. **Wajib service role key** (bypass RLS) — jangan pernah commit nilai ini.

**9. Jalankan**

```bash
npm run dev        # http://localhost:3000
```

---

## 6. Environment Variables

Buat `.env.local`:

```env
# Wajib — dari Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# Wajib — SERVER ONLY, bypass RLS. Tidak boleh bocor ke client/git
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Opsional — domain produksi untuk URL di dalam QR
# (kalau kosong, dipakai dari Host header request — cukup untuk Vercel)
NEXT_PUBLIC_SITE_URL=https://pkkmb.example.com
```

| Variabel | Dipakai oleh | Keterangan |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | semua client | URL project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + SSR | Kunci publik, tunduk RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | API routes | Bypass RLS — hanya di server |
| `NEXT_PUBLIC_SITE_URL` | halaman `/dashboard/qr` | Basis URL QR; fallback: `x-forwarded-proto` + `host` |

---

## 7. Database Schema

Enam tabel di schema `public` (definisi lengkap: `supabase/seed-database.sql`):

```
prodi ──┐
        ├──◄── mahasiswa ──┬──◄── attendance
panitia ─┘                 └──◄── feedback
   │
   ├──◄── qr_session (created_by)
   └──◄── attendance.flagged_by / input_by
```

| Tabel | Kolom kunci | Catatan |
| --- | --- | --- |
| `prodi` | `kode`*, `nama` | 16 baris. *`kode` dipakai sebagai unique key oleh script seed. |
| `panitia` | `email` (unique), `nama`, `role` (`admin`/`panitia`) | `id` = UUID di `auth.users`. |
| `mahasiswa` | `nama`, `nama_normalized`, `email`, `no_wa`, `prodi_id` FK | **Tidak ada kolom NIM** — dihapus secara sengaja; identitas alternatif: email/no_wa. `nama_normalized` dipakai untuk search (lowercase + tanpa tanda baca). |
| `qr_session` | `token` (unique), `day` 1–6, `type` `absensi`/`feedback`, `is_active`, `created_by` FK panitia | Satu baris = satu sesi QR. |
| `attendance` | `mahasiswa_id` FK, `day`, `mode` `offline`/`online`, `foto_url`, `is_flagged`, `flag_reason`, `flagged_at`, `flagged_by`, `submitted_at` | Bukti foto disimpan sebagai URL publik Storage. |
| `feedback` | `mahasiswa_id` FK, `day`, `q1_materi`…`q6_puas` (1–5), `kelebihan`, `saran`, `sumbitted_at` | **`sumbitted_at` typo dari awal** — dipertahankan agar kompatibel dengan kode; jangan "perbaiki" separahnya tanpa migrasi menyeluruh. |

### Constraint penting

| Constraint | Efek |
| --- | --- |
| `UNIQUE (mahasiswa_id, day)` di `attendance` & `feedback` | **1 mahasiswa = 1 absen & 1 feedback per hari**, ditegakkan DB. Kode menangkap error `23505` → HTTP 409 "sudah absen". |
| `CHECK day BETWEEN 1 AND 6` | Event 6 hari. |
| `CHECK mode IN ('offline','online')` | — |
| `CHECK q*_… BETWEEN 1 AND 5` | Rating Likert valid. |

### Index & ekstensi

- `CREATE EXTENSION pg_trgm` + GIN index pada `nama_normalized` → pencarian ilike `%q%` tetap cepat di ±1500 baris.
- Index pada `attendance(day)`, `feedback(day)`, dan partial index `qr_session(is_active) WHERE is_active`.

---

## 8. Keamanan & Model Akses

### Tiga jenis koneksi Supabase

| Modul | Kunci | Kapan dipakai |
| --- | --- | --- |
| `lib/supabase-client.ts` (browser) | anon | Login, logout, subscribe realtime |
| `lib/supabase-server.ts` (SSR) | anon + cookie | Server Components (dashboard), verifikasi user di API |
| `lib/supabase-admin.ts` | **service role** | Tulis data dari API routes; bypass RLS. **Tidak boleh di-import di client component.** |

### Alur autentikasi

1. **`middleware.ts`** (matcher: `/`, `/dashboard/:path*`, `/login`) memakai pola auth-refresh `@supabase/ssr`: refresh cookie sesi, lalu:
   - `/` → redirect ke `/dashboard` (sudah login) atau `/login`.
   - `/dashboard/*` tanpa sesi → `/login`. `/login` dengan sesi → `/dashboard`.
   - Login → inject header `x-user-id` & `x-user-email` ke request downstream.
2. **`app/dashboard/layout.tsx`** membaca `x-user-id` via `getUserIdFromHeader()` (tanpa panggilan `getUser()` ganda), lalu verifikasi baris `panitia` ada. Tidak ada → redirect login. Praktisnya: **akun auth tanpa baris `panitia` tidak bisa masuk dashboard.**
3. **API routes mutasi** memverifikasi user lewat SSR client, mengambil `panitia.id` (via email), lalu menulis via admin client.
4. **`AutoLogout`** (client) signOut otomatis setelah 5 menit idle.

### Matriks RLS (dari seed SQL)

| Tabel | `anon` | `authenticated` (panitia) | `service_role` (API) |
| --- | --- | --- | --- |
| `prodi`, `panitia`, `mahasiswa`, `attendance`, `feedback` | ditolak | SELECT saja | bypass |
| `qr_session` | perlu policy SELECT (lihat §5 langkah 6) | SELECT + INSERT + UPDATE + DELETE | bypass |

> Sengaja dirancang: form publik (absensi/feedback/search) **tidak menulis langsung dari browser** — semua lewat API route yang memvalidasi token QR, tipe file, ukuran, dan duplikasi sebelum menyentuh DB dengan service role.

---

## 9. API Reference

Konvensi: respons error berbentuk `{ "error": "pesan" }`. Auth = cookie sesi panitia.

### `POST /api/qr` — buat sesi QR 🔒

Body JSON: `{ "day": 1–6, "type": "absensi" | "feedback" }`
Token dihasilkan otomatis: `PKKMB-D{day}-{HHMM}` (absensi) / `PKKMB-F{day}-{HHMM}` (feedback).
Sukes: objek sesi. Error: `401` belum login · `403` bukan panitia · `400` type invalid · `500` gagal insert.

### `PATCH /api/qr/{id}` — akhiri sesi 🔒

Set `is_active = false` (dipakai tombol "Akhiri Sesi"). Error: `401/403/500`.

### `DELETE /api/qr/history` — hapus riwayat sesi 🔒

Menghapus **semua** `qr_session` dengan `is_active = false`. Error: `401/500`.

### `POST /api/attendance/submit` — submit absensi 🌐 (publik)

`multipart/form-data`: `token`, `student_id`, `mode` (`offline|online`), `photo` (image, ≤ 5 MB).

Validasi berurutan: kelengkapan field → mode → tipe & ukuran file → token valid & `is_active` → mahasiswa ada → upload foto → insert.
Foto disimpan di bucket `pkkmb-photos` dengan path `{day}/{mahasiswa_id}-{timestamp}.{ext}` (ekstensi diambil dari MIME, bukan nama file — mencegah ekstensi palsu).
Error: `400` field/mode/tipe file · `413` > 5 MB · `404` token/mahasiswa · `403` sesi berakhir · `409` sudah absen · `500` upload/insert.

### `PATCH /api/attendance/{id}/flag` — flag absensi 🔒

Body: `{ "flagged": true, "reason": "bukan foto diri sendiri" }` atau `{ "flagged": false }`.
Flag: set `is_flagged, flag_reason, flagged_at, flagged_by`. Unflag: reset semua kolom. Error: `400` body · `401/403` · `500`.

### `POST /api/feedback/submit` — submit feedback 🌐 (publik)

Body JSON: `token`, `student_id`, enam rating `q1_materi … q6_puas` (wajib integer 1–5), `kelebihan?`, `saran?`.
Token harus aktif **dan bertipe `feedback`** (QR absensi ditolak `400`). Error: `400` validasi/tipe token · `403` sesi berakhir · `404` token/mahasiswa · `409` sudah mengisi · `500`.

### `GET /api/students/search?q=…&day=…&for=…` 🌐 (publik)

Pencarian nama untuk form absensi (`for=absensi`, default) atau feedback (`for=feedback`).
- `q` minimal 2 karakter, dicocokkan `ilike` ke `nama_normalized`, hasil maks **10** baris.
- `day` + `for` menentukan tabel exclude: mahasiswa yang **sudah absen/sudah feedback** di hari itu otomatis tidak muncul.
- Respons: `{ "students": [{ "id", "nama", "prodi_nama" }] }`.

---

## 10. Aturan Bisnis & Anti-Fraud

1. **QR unik per hari + tipe.** QR kemarin tidak berlaku lagi (sesi dinonaktifkan panitia), dan QR absensi tidak bisa dipakai untuk feedback (dicek `type`).
2. **1 mahasiswa = 1 absen + 1 feedback per hari**, ditegakkan constraint DB — race/double-tap tidak bisa menembus.
3. **Foto wajib** sebagai bukti; divalidasi tipe (image/*), ukuran (≤ 5 MB), dan disimpan dengan nama yang tidak bisa dipalsukan mahasiswa (`{day}/{uuid_mahasiswa}-{timestamp}`).
4. **Pencarian nama anti-duplikat**: yang sudah absen hilang dari hasil pencarian di hari yang sama.
5. **Sistem flag**: panitia menandai absensi mencurigakan lengkap dengan alasan, waktu, dan pelapor — jejak audit tersimpan di DB.
6. **Re-submit tidak ada self-service.** Kalau mahasiswa salah submit, penyelesaiannya: panitia **menghapus record attendance** di Supabase, lalu mahasiswa mengulang absensi.
7. Fisik: panitia menjaga pintu masuk — sistem adalah lapis digital, bukan pengganti.

---

## 11. Catatan Teknis Penting (Gotchas)

Bagian ini adalah hal-hal yang **perlu diketahui sebelum mengubah apa pun** — semuanya pernah menggigit.

### 11.1 PostgREST membatasi 1000 baris per query

Tabel `mahasiswa` ±1.500 baris. Query Supabase tanpa `.range()` **diam-diam terpotong di 1000 baris** — pernah menyebabkan bug "total mahasiswa 1398 tapi laporan 1000". Pola wajib untuk query besar (contoh implementasi: `app/dashboard/page.tsx` dan `app/dashboard/reports/page.tsx`):

```ts
const PAGE = 1000;
let from = 0;
while (true) {
  const { data } = await supabase.from("mahasiswa")
    .select("id, nama").range(from, from + PAGE - 1);
  if (!data?.length) break;
  all.push(...data);
  if (data.length < PAGE) break;
  from += PAGE;
}
```

### 11.2 Limit body Vercel ± 4,5 MB

Serverless function di Vercel menolak body di atas ±4,5 MB, jadi meski validasi server mengizinkan foto 5 MB, upload nyata di produksi bisa gagal lebih awal. Jaga foto di bawah ±4 MB.

### 11.3 Kuota Storage vs 9.000 foto

Perkiraan volume: 1.500 mahasiswa × 6 hari = **±9.000 foto**. Kamera browser menghasilkan ±100–500 KB/foto (JPEG q0.9, resolusi stream apa adanya), upload galeri bisa 2–5 MB. Total bisa 2,7–26 GB — **melebihi kuota free tier Supabase (1 GB)**. Status per Agustus 2026: kompresi client & alternatif storage (mis. Cloudinary free) sedang dievaluasi. Lihat §15.

### 11.4 Token QR memuat jam-menit pembuatan

Dua sesi untuk hari+tipe yang sama yang dibuat **dalam menit yang sama** menghasilkan token identik → gagal constraint `token UNIQUE`. Solusi: tunggu ganti menit, atau akhiri + hapus sesi lama dulu.

### 11.5 URL di dalam QR

URL QR dibangun dari `NEXT_PUBLIC_SITE_URL` atau `x-forwarded-proto`/`host` request. Di balik proxy, pastikan header tersebut benar supaya QR berisi domain yang bisa di-scan dari internet (bukan `localhost`).

### 11.6 Halaman dashboard wajib `dynamic = "force-dynamic"`

Semua page dashboard memakai `export const dynamic = "force-dynamic"` — data harus selalu segar (dan cookie bersifat per-request). Jangan hapus ini atau angka akan membeku di cache.

### 11.7 Realtime butuh publication aktif

Auto-refresh dashboard bergantung pada `postgres_changes`; tabel harus masuk publication `supabase_realtime` (§5 langkah 5). Kalau lupa, dashboard hanya refresh manual.

---

## 12. Design System

Palet brand didefinisikan di `tailwind.config.ts` dan dipakai konsisten. **Perhatikan peran semantiknya** — salah pakai merusak konsistensi visual:

| Token | Warna | Peran semantik |
| --- | --- | --- |
| `ember` | `#F5E26C` (kuning) | **Aksen/highlight** — badge, item aktif, ikon sukses. Jangan dipakai untuk tombol primer. Kontras teks: `twilight`/`black`, **bukan putih**. |
| `twilight` | `#801831` (maroon) | **Primer** — header, tombol utama, teks brand. |
| `inferno` | `#C71A2D` (merah) | **Bahaya/hover/destruktif** — error, hover tombol primer, flag. |
| default `black` + `#1d1c1c` | — | Permukaan kartu & latar. |

Font: **Montserrat** via `next/font`. Aset: `public/logo.png`, `public/cak-u-logo.png`.

---

## 13. Deployment (Vercel)

1. Push repo ke GitHub → import project di Vercel.
2. Set keempat environment variables (§6) di Vercel — khususnya `SUPABASE_SERVICE_ROLE_KEY` sebagai **secret**, bukan env public.
3. Set `NEXT_PUBLIC_SITE_URL` ke domain produksi agar QR memuat URL yang benar.
4.Framework preset Next.js terdeteksi otomatis; tidak ada konfigurasi build khusus (`npm run build`).
5. Di Supabase → Authentication → URL Configuration, sesuaikan Site/Redirect URLs dengan domain produksi.

Operasional pasca-deploy yang perlu dipantau: kuota Storage (§11.3) dan egress — foto adalah konsumen terbesar.

---

## 14. Runbook Hari-H (Operasional Panitia)

**Sebelum acara (sekali):**
- [ ] Impor data mahasiswa terbaru dari Excel daftar ulang (`scripts/seed_mahasiswa.py`)
- [ ] Buat akun panitia (auth + baris `panitia`)
- [ ] Cek Realtime publication aktif (§5.5)
- [ ] Uji satu sesi QR end-to-end di HP: scan → absensi → muncul di dashboard → foto tampil

**Setiap hari acara:**
1. Panitia buka `/dashboard/qr` → **Buat Sesi** (absensi, hari ke-N) → proyeksikan QR di layar/pintu masuk.
2. Pantau `/dashboard` (auto-refresh) — kolom "Prodi yang perlu absen" menunjukkan prodi yang harus didorong.
3. Panitia keamanan review foto di `/dashboard/attendance` → flag yang mencurigakan + alasan.
4. Sesi absensi ditutup → **Akhiri Sesi**.
5. (Opsional) Buka sesi **feedback** di akhir rangkaian materi hari itu.
6. Setelah hari bersih: `/dashboard/qr` → hapus riwayat sesi nonaktif (menjaga daftar ringkas).

**Setelah 6 hari:**
- Export laporan per hari/prodi dari `/dashboard/reports` (PDF) untuk rektorat.
- **Backup data**: export tabel `attendance` & `feedback` (CSV dari Supabase) + unduh bucket `pkkmb-photos` ke penyimpanan lokal — jangan mengandalkan satu tempat.

---

## 15. Keterbatasan & Rencana

Status per **Agustus 2026** — jadikan peta kerja, bukan alasan:

| Item | Status | Rencana |
| --- | --- | --- |
| Kompresi foto client | ❌ belum (JPEG q0.9, resolusi kamera apa adanya) | Resize max 1080px + q0.7 → ±150–250 KB/foto, total 6 hari turun ke 1,3–2,2 GB |
| Kuota Storage (1 GB free < 2,7–26 GB kebutuhan) | ⚠️ dievaluasi | Opsi: Cloudinary free tier (migrasi mudah — coupling hanya di `api/attendance/submit`) atau arsip harian ke lokal + hapus (berisiko: dashboard foto rusak, sekali lupa = upload gagal) |
| Export Excel | ❌ belum (PDF saja; `xlsx` sudah terpasang) | Tambah tombol export XLSX di reports bila dibutuhkan rektorat |
| Re-submit absensi mandiri | ❌ tidak ada (hapus manual oleh panitia) | Bila perlu: alur approval sederhana |
| CRUD mahasiswa dari dashboard | ❌ belum (data via script Excel) | Form tambah/edit bila panitia non-teknis perlu |
| Notifikasi prodi belumlah hadir | ❌ belum | Push/wa broadcast opsional |

---

## Konvensi Commit

Riwayat commit memakai prefiks konvensional ringkas — pertahankan: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:` (contoh nyata: `fix api attendance validasi foto wajib gambar maks 5mb`).

## Lisensi

Internal — Divisi Registrasi PKKMB Universitas Cakrawala. Tidak untuk distribusi publik.
