-- ============================================================
-- Migration: Hapus kolom fakultas dari tabel prodi
-- Tanggal   : 2026-08-14
-- Tujuan    : Kolom fakultas tidak pernah terisi data, dihapus dari UI & database
-- Cara pakai : Supabase Dashboard > SQL Editor > New query > paste > RUN
-- Aman di-run berkali-kali (idempotent: pakai IF EXISTS)
-- CATATAN   : Data di kolom ini (kalau ada) akan hilang permanen.
-- ============================================================

ALTER TABLE prodi
    DROP COLUMN IF EXISTS fakultas;

-- (Verifikasi) Struktur prodi harusnya tinggal: id, kode, nama, created_at
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'prodi'
-- ORDER BY ordinal_position;
