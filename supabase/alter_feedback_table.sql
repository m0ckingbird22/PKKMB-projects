-- ============================================================
-- Migration: Restruktur tabel feedback
-- Tanggal   : 2026-08-14
-- Tujuan    : Ganti rating/kategori/komentar -> 6 kolom Likert + 2 teks terbuka
-- Cara pakai : Supabase Dashboard > SQL Editor > New query > paste > RUN
-- Aman di-run berkali-kali (idempotent: pakai IF EXISTS / IF NOT EXISTS)
-- ============================================================

-- 1. (Opsional) Kosongkan tabel dulu kalau ada data lama yang ingin dibersihkan.
--    Hapus tanda -- di baris di bawah kalau mau mulai dari kosong:
-- TRUNCATE TABLE feedback;

-- 2. Drop kolom lama
ALTER TABLE feedback
    DROP COLUMN IF EXISTS rating,
    DROP COLUMN IF EXISTS kategori,
    DROP COLUMN IF EXISTS komentar;

-- 3. Tambah kolom baru: 6 rating Likert (int 1-5) + 2 pertanyaan terbuka (text)
ALTER TABLE feedback
    ADD COLUMN IF NOT EXISTS q1_materi     int,
    ADD COLUMN IF NOT EXISTS q2_narasumber int,
    ADD COLUMN IF NOT EXISTS q3_panitia    int,
    ADD COLUMN IF NOT EXISTS q4_jadwal     int,
    ADD COLUMN IF NOT EXISTS q5_fasilitas  int,
    ADD COLUMN IF NOT EXISTS q6_puas       int,
    ADD COLUMN IF NOT EXISTS kelebihan     text,
    ADD COLUMN IF NOT EXISTS saran         text;

-- 4. CHECK constraint supaya rating hanya boleh 1-5 (NULL di-allow demi migrasi)
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS chk_q1_materi;
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS chk_q2_narasumber;
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS chk_q3_panitia;
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS chk_q4_jadwal;
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS chk_q5_fasilitas;
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS chk_q6_puas;

ALTER TABLE feedback
    ADD CONSTRAINT chk_q1_materi     CHECK (q1_materi     IS NULL OR q1_materi     BETWEEN 1 AND 5),
    ADD CONSTRAINT chk_q2_narasumber CHECK (q2_narasumber IS NULL OR q2_narasumber BETWEEN 1 AND 5),
    ADD CONSTRAINT chk_q3_panitia    CHECK (q3_panitia    IS NULL OR q3_panitia    BETWEEN 1 AND 5),
    ADD CONSTRAINT chk_q4_jadwal     CHECK (q4_jadwal     IS NULL OR q4_jadwal     BETWEEN 1 AND 5),
    ADD CONSTRAINT chk_q5_fasilitas  CHECK (q5_fasilitas  IS NULL OR q5_fasilitas  BETWEEN 1 AND 5),
    ADD CONSTRAINT chk_q6_puas       CHECK (q6_puas       IS NULL OR q6_puas       BETWEEN 1 AND 5);

-- 5. (Verifikasi) Lihat struktur akhir
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'feedback'
-- ORDER BY ordinal_position;
