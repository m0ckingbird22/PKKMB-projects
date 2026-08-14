-- ============================================================
-- Full Setup: PKKMB System Database
-- Tanggal   : 2026-08-14
-- Isi       : Ekstensi, semua tabel, constraint, index, RLS + policy
-- Cara pakai : Supabase Dashboard > SQL Editor > New query > paste > RUN
-- Aman di-run di database yang UDAH ada data (idempotent):
--   - CREATE TABLE IF NOT EXISTS  -> skip kalau tabel udah ada
--   - Constraint pakai DO block   -> skip kalau constraint udah ada
--   - DROP POLICY IF EXISTS dulu  -> policy di-replace, bukan dobel
--
-- CATATAN PENTING:
-- 1. Akun panitia TIDAK ada di sini — panitia login pakai Supabase
--    Auth (Authentication > Users). Tabel `panitia` cuma data pelengkap.
-- 2. Storage bucket `pkkmb-photos` diatur terpisah di dashboard Storage.
-- 3. Kolom `sumbitted_at` di feedback memang typo dari awal (ikut skema
--    asli biar gak putus sama kode yang ada).
-- ============================================================

-- ── 1. Ekstensi (buat pencarian nama fuzzy/ilike cepat)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── 2. Tabel (urutan: induk dulu, baru anak)
CREATE TABLE IF NOT EXISTS prodi (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kode        text NOT NULL,
    nama        text NOT NULL,
    created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS panitia (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email       text NOT NULL UNIQUE,
    nama        text NOT NULL,
    role        text NOT NULL DEFAULT 'panitia',
    created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mahasiswa (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nama            text NOT NULL,
    nama_normalized text,
    email           text,
    no_wa           text,
    prodi_id        uuid NOT NULL REFERENCES prodi(id),
    created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qr_session (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token       text NOT NULL UNIQUE,
    day         int  NOT NULL CHECK (day BETWEEN 1 AND 6),
    type        text NOT NULL DEFAULT 'absensi',
    is_active   boolean DEFAULT true,
    created_by  uuid REFERENCES panitia(id),
    created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mahasiswa_id uuid NOT NULL REFERENCES mahasiswa(id),
    day          int  NOT NULL CHECK (day BETWEEN 1 AND 6),
    mode         text NOT NULL CHECK (mode IN ('offline', 'online')),
    foto_url     text NOT NULL,
    is_flagged   boolean DEFAULT false,
    flag_reason  text,
    flagged_at   timestamptz,
    flagged_by   uuid REFERENCES panitia(id),
    input_by     uuid REFERENCES panitia(id),
    submitted_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedback (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mahasiswa_id    uuid NOT NULL REFERENCES mahasiswa(id),
    day             int  NOT NULL CHECK (day BETWEEN 1 AND 6),
    q1_materi       int,
    q2_narasumber   int,
    q3_panitia      int,
    q4_jadwal       int,
    q5_fasilitas    int,
    q6_puas         int,
    kelebihan       text,
    saran           text,
    sumbitted_at    timestamptz DEFAULT now()
);

-- ── 3. Constraint tambahan (DO block = skip kalau udah ada)
-- Satu mahasiswa cuma boleh satu absen / satu feedback per hari.
-- (Kode sudah mengandalkan ini: error 23505 ditangani sebagai "sudah absen".)
DO $$ BEGIN
    ALTER TABLE attendance
        ADD CONSTRAINT attendance_mahasiswa_day_unique
        UNIQUE (mahasiswa_id, day);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE feedback
        ADD CONSTRAINT feedback_mahasiswa_day_unique
        UNIQUE (mahasiswa_id, day);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Rating Likert hanya boleh 1-5 (NULL boleh demi migrasi)
DO $$ BEGIN
    ALTER TABLE feedback ADD CONSTRAINT chk_q1_materi
        CHECK (q1_materi IS NULL OR q1_materi BETWEEN 1 AND 5);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE feedback ADD CONSTRAINT chk_q2_narasumber
        CHECK (q2_narasumber IS NULL OR q2_narasumber BETWEEN 1 AND 5);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE feedback ADD CONSTRAINT chk_q3_panitia
        CHECK (q3_panitia IS NULL OR q3_panitia BETWEEN 1 AND 5);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE feedback ADD CONSTRAINT chk_q4_jadwal
        CHECK (q4_jadwal IS NULL OR q4_jadwal BETWEEN 1 AND 5);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE feedback ADD CONSTRAINT chk_q5_fasilitas
        CHECK (q5_fasilitas IS NULL OR q5_fasilitas BETWEEN 1 AND 5);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE feedback ADD CONSTRAINT chk_q6_puas
        CHECK (q6_puas IS NULL OR q6_puas BETWEEN 1 AND 5);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 4. Index (biar query filter/search cepat)
CREATE INDEX IF NOT EXISTS idx_mahasiswa_nama_trgm
    ON mahasiswa USING gin (nama_normalized gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_attendance_day ON attendance(day);
CREATE INDEX IF NOT EXISTS idx_feedback_day ON feedback(day);
CREATE INDEX IF NOT EXISTS idx_qr_session_active ON qr_session(is_active) WHERE is_active;

-- ── 5. RLS: nyalakan satpam di semua tabel
-- Prinsip:
--   * anon (tamu tanpa login)          -> DITOLAK semua tabel
--   * authenticated (panitia login)     -> boleh BACA semua tabel,
--                                          boleh tulis qr_session (bikin/
--                                          matikan/hapus sesi dari dashboard)
--   * service_role (server/API routes)  -> bypass RLS, tidak kena aturan ini
ALTER TABLE prodi      ENABLE ROW LEVEL SECURITY;
ALTER TABLE panitia    ENABLE ROW LEVEL SECURITY;
ALTER TABLE mahasiswa  ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback   ENABLE ROW LEVEL SECURITY;

-- prodi: read-only untuk yang login
DROP POLICY IF EXISTS "prodi_read_authenticated" ON prodi;
CREATE POLICY "prodi_read_authenticated" ON prodi
    FOR SELECT TO authenticated USING (true);

-- panitia: read-only untuk yang login
-- ( INSERT/UPDATE panitia dilakukan lewat SQL editor / service_role )
DROP POLICY IF EXISTS "panitia_read_authenticated" ON panitia;
CREATE POLICY "panitia_read_authenticated" ON panitia
    FOR SELECT TO authenticated USING (true);

-- mahasiswa: read-only untuk yang login
-- ( pencarian nama di form publik pakai service_role, jadi aman )
DROP POLICY IF EXISTS "mahasiswa_read_authenticated" ON mahasiswa;
CREATE POLICY "mahasiswa_read_authenticated" ON mahasiswa
    FOR SELECT TO authenticated USING (true);

-- attendance: read-only untuk yang login
-- ( insert dari form absensi & flag dari dashboard pakai service_role )
DROP POLICY IF EXISTS "attendance_read_authenticated" ON attendance;
CREATE POLICY "attendance_read_authenticated" ON attendance
    FOR SELECT TO authenticated USING (true);

-- feedback: read-only untuk yang login
-- ( insert dari form feedback pakai service_role )
DROP POLICY IF EXISTS "feedback_read_authenticated" ON feedback;
CREATE POLICY "feedback_read_authenticated" ON feedback
    FOR SELECT TO authenticated USING (true);

-- qr_session: full akses untuk yang login (dashboard: buat/matiin/hapus sesi)
DROP POLICY IF EXISTS "qr_session_read_authenticated" ON qr_session;
CREATE POLICY "qr_session_read_authenticated" ON qr_session
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "qr_session_insert_authenticated" ON qr_session;
CREATE POLICY "qr_session_insert_authenticated" ON qr_session
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "qr_session_update_authenticated" ON qr_session;
CREATE POLICY "qr_session_update_authenticated" ON qr_session
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "qr_session_delete_authenticated" ON qr_session;
CREATE POLICY "qr_session_delete_authenticated" ON qr_session
    FOR DELETE TO authenticated USING (true);

-- ── 6. (Opsional) Seed data contoh — hapus tanda -- dan sesuaikan
-- INSERT INTO prodi (kode, nama) VALUES
--     ('TI',  'Teknik Informatika'),
--     ('SI',  'Sistem Informasi'),
--     ('MNJ', 'Manajemen');

-- INSERT INTO panitia (email, nama, role) VALUES
--     ('ketua@panitia.com',  'Ketua Panitia', 'admin'),
--     ('anggota@panitia.com','Anggota',       'panitia');
-- ( password TIDAK di-set di sini — akun dibuat di Authentication > Users )

-- ── 7. (Verifikasi) Status RLS + policy setelah dijalankan
-- SELECT tablename, rowsecurity FROM pg_tables
--     WHERE schemaname = 'public' ORDER BY tablename;
-- SELECT tablename, policyname, cmd, roles FROM pg_policies
--     WHERE schemaname = 'public' ORDER BY tablename, cmd;
