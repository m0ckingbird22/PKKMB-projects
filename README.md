# PKKMB System — Universitas Cakrawala

Sistem registrasi dan absensi digital untuk PKKMB (Pengenalan Kehidupan Kampus bagi Mahasiswa Baru) Universitas Cakrawala. Dibangun untuk mengelola kehadiran ~2.000 mahasiswa baru dari 16 program studi selama 6 hari, dengan mode hybrid (offline & online).

## Tech Stack

| Layer        | Teknologi                             |
| ------------ | ------------------------------------- |
| Framework    | Next.js 14 (App Router) + TypeScript  |
| Database     | Supabase (PostgreSQL)                 |
| Auth         | Supabase Auth + `@supabase/ssr`       |
| Storage      | Supabase Storage (foto bukti absensi) |
| Styling      | Tailwind CSS                          |
| Icons        | Lucide React                          |
| QR Generator | `qrcode`                              |
| Excel        | `xlsx` (SheetJS) — import & export    |
| Deployment   | Vercel                                |

## Fitur

- **Auth panitia** — login email/password, role admin/panitia, middleware proteksi route
- **Data mahasiswa** — CRUD, import Excel, search by NIM/nama, filter per prodi, pagination
- **QR system** — generate QR unik per hari, validasi token
- **Form absensi** — public route, validasi NIM, anti double submit, upload foto wajib
- **Review foto** — grid foto per hari, flag absensi mencurigakan
- **Dashboard realtime** — rekap kehadiran per prodi, breakdown offline/online
- **Feedback harian** — rating per kategori, agregasi, komentar anonim
- **Export laporan** — Excel siap serah ke rektorat

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Akun Supabase
- Python 3.x (untuk seed data awal)

### Installation

**1. Clone repo**

```bash
git clone https://github.com/username/pkkmb-system.git
cd pkkmb-system
```

**2. Install dependencies**

```bash
npm install
```

**3. Setup environment variables**

Copy `.env.example` ke `.env.local`:

```bash
cp .env.example .env.local
```

Isi values dari Supabase dashboard (Settings → API):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**4. Setup database**

Jalankan schema SQL di Supabase SQL Editor:

```sql
-- Lihat file: docs/schema.sql
```

**5. Seed data prodi**

Jalankan di Supabase SQL Editor:

```sql
INSERT INTO prodi (kode, nama, fakultas) VALUES
  ('AKT',  'Akuntansi',                                  'School of Business & Economics'),
  ('BD',   'Bisnis Digital',                             'School of Business & Economics'),
  ('FI',   'Finance & Investment',                       'School of Business & Economics'),
  ('MNJ',  'Manajemen',                                  'School of Business & Economics'),
  ('ILKOM','Ilmu Komunikasi',                            'School of Communication & Design'),
  ('DKV',  'Desain Komunikasi Visual (DKV)',              'School of Communication & Design'),
  ('PSI',  'Psikologi',                                  'School of Psychology & Education'),
  ('PGSD', 'Pendidikan Guru Sekolah Dasar (PGSD)',        'School of Psychology & Education'),
  ('HKM',  'Ilmu Hukum',                                 'School of Law'),
  ('AI',   'Artificial Intelligence',                    'School of AI & Computer Science'),
  ('DS',   'Data Science',                               'School of AI & Computer Science'),
  ('IK',   'Ilmu Komputer',                              'School of AI & Computer Science'),
  ('SI',   'Sistem Informasi',                           'School of AI & Computer Science'),
  ('TE',   'Teknik Elektro',                             'School of Engineering'),
  ('TI',   'Teknik Industri',                            'School of Engineering'),
  ('TLR',  'Teknik Lingkungan & Rekayasa Berkelanjutan', 'School of Engineering');
```

**6. Import data mahasiswa (opsional — untuk development)**

```bash
pip install pandas openpyxl supabase
python scripts/import_mahasiswa.py
```

> Pastikan isi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` di script sebelum dijalankan. Jangan commit credentials ke repo.

**7. Buat akun panitia pertama**

Di Supabase → Authentication → Users → Add user, lalu insert ke tabel `panitia`:

```sql
INSERT INTO panitia (id, nama, email, role)
VALUES (
  'uuid-dari-auth-users',
  'Nama Admin',
  'admin@pkkmb.com',
  'admin'
);
```

**8. Jalankan dev server**

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Project Structure

```
pkkmb-system/
├── app/
│   ├── dashboard/              # Halaman panitia (protected)
│   │   ├── layout.tsx          # Auth check + sidebar
│   │   ├── page.tsx            # Dashboard utama
│   │   ├── students/           # Data mahasiswa
│   │   │   ├── page.tsx
│   │   │   └── _components/
│   │   ├── qr/                 # QR generator
│   │   ├── attendance/         # Rekap absensi
│   │   ├── feedback/           # Rekap feedback
│   │   └── reports/            # Export laporan
│   ├── login/
│   │   └── page.tsx
│   ├── absensi/[token]/        # Form absensi publik (mahasiswa)
│   │   └── page.tsx
│   └── feedback/[token]/       # Form feedback publik (mahasiswa)
│       └── page.tsx
├── components/
│   ├── dashboard/
│   │   └── sidebar.tsx
│   └── ui/                     # Reusable components
├── lib/
│   ├── supabase-client.ts      # Browser client
│   └── supabase-server.ts      # Server client (SSR)
├── types/                      # TypeScript interfaces
├── scripts/
│   └── import_mahasiswa.py     # Seed script (jangan commit credentials)
├── public/                     # Static assets
├── middleware.ts               # Route protection
└── .env.example
```

## Database Schema

6 tabel utama:

| Tabel         | Deskripsi                              |
| ------------- | -------------------------------------- |
| `prodi`       | 16 program studi + fakultas            |
| `students`    | Data mahasiswa peserta PKKMB           |
| `panitia`     | Akun panitia (linked ke Supabase Auth) |
| `qr_sessions` | Token QR unik per hari (hari 1–6)      |
| `attendance`  | Rekap absensi + foto + flag system     |
| `feedback`    | Rating harian per kategori             |

## RLS Policies

Semua tabel menggunakan Row Level Security (RLS). Pastikan policy berikut sudah dibuat:

```sql
-- panitia: hanya bisa baca data diri sendiri
CREATE POLICY "panitia_select_own" ON panitia
FOR SELECT TO authenticated USING (auth.uid() = id);

-- students, prodi, attendance, feedback, qr_sessions:
-- semua authenticated user bisa read
CREATE POLICY "authenticated_read" ON students
FOR SELECT TO authenticated USING (true);
-- (ulangi untuk tabel lainnya)
```

## Environment Variables

| Variable                        | Keterangan                              |
| ------------------------------- | --------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL project Supabase                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (public, aman di client)       |
| `SUPABASE_SERVICE_ROLE_KEY`     | Service role key (rahasia, server only) |

> ⚠️ **Jangan pernah expose `SUPABASE_SERVICE_ROLE_KEY` ke client.** Variable ini bypass semua RLS policies.

## Anti-Fraud System

Sistem absensi dilindungi 3 lapis:

| Lapis | Mekanisme                                                   |
| ----- | ----------------------------------------------------------- |
| 1     | QR berbeda tiap hari — foto QR hari lalu tidak bisa dipakai |
| 2     | Foto wajib di depan background fisik PKKMB per hari         |
| 3     | Panitia jaga pintu masuk secara fisik                       |

## Contributing

1. Fork repo
2. Buat branch baru: `git checkout -b feat/nama-fitur`
3. Commit: `git commit -m "feat: deskripsi singkat"`
4. Push: `git push origin feat/nama-fitur`
5. Buat Pull Request

## License

Internal use only — Divisi Registrasi PKKMB Universitas Cakrawala.
