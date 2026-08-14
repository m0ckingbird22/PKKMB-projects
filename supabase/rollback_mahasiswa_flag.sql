-- ============================================================
-- Rollback: Hapus kolom flag dari tabel mahasiswa
-- Tanggal   : 2026-08-14
-- Tujuan    : Membatalkan alter_mahasiswa_flag.sql (fitur flag pindah ke attendance)
-- Cara pakai : Supabase Dashboard > SQL Editor > New query > paste > RUN
-- Aman di-run berkali-kali (idempotent: pakai IF EXISTS)
-- CATATAN   : Ini HANYA menyentuh tabel mahasiswa.
--             Kolom is_flagged dst. di tabel attendance JANGAN dihapus,
--             karena dipakai fitur tandai janggal di halaman absensi.
-- ============================================================

-- 1. Hapus index partial
DROP INDEX IF EXISTS idx_mahasiswa_is_flagged;

-- 2. Hapus FK ke panitia (drop column sebenarnya ikut menghapus FK,
--    tapi eksplisit lebih aman kalau urutannya berubah)
ALTER TABLE mahasiswa
    DROP CONSTRAINT IF EXISTS mahasiswa_flagged_by_fkey;

-- 3. Hapus kolom flag
ALTER TABLE mahasiswa
    DROP COLUMN IF EXISTS is_flagged,
    DROP COLUMN IF EXISTS flag_reason,
    DROP COLUMN IF EXISTS flagged_at,
    DROP COLUMN IF EXISTS flagged_by;

-- (Verifikasi) Struktur mahasiswa harusnya kembali tanpa kolom flag
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'mahasiswa'
-- ORDER BY ordinal_position;
