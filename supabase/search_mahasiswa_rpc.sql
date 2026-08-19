-- ============================================================
-- RPC: search_mahasiswa(q, day, for_type)
-- Tanggal  : 2026-08-19
-- Fungsi   : Pencarian nama mahasiswa untuk form absensi/feedback,
--            sekaligus mengecualikan yang SUDAH absen/sudah feedback
--            di hari tertentu — semua dikerjakan database
--            (anti-join NOT EXISTS ber-index), bukan di aplikasi.
--
-- Cara pakai : Supabase Dashboard > SQL Editor > New query > paste > RUN
-- Idempotent : CREATE OR REPLACE — aman dijalankan berulang.
--
-- Kenapa RPC, bukan query NOT IN dari aplikasi?
--   Versi lama: 2 round-trip + kirim daftar UUID (±50 KB di akhir hari)
--   per pencarian. Versi ini: 1 round-trip, ±100 byte parameter,
--   kecepatan stabil dari pagi sampai sore.
--
-- Dipanggil dari : app/api/students/search/route.ts (pakai service_role)
-- TIDAK untuk anon: EXECUTE di-revoke dari anon (defense-in-depth;
--   dengan SECURITY INVOKER + RLS, anon memang sudah tak bisa baca
--   tabelnya — revoke membuatnya eksplisit).
-- ============================================================

CREATE OR REPLACE FUNCTION search_mahasiswa(
  q         text,
  day       int,
  for_type  text DEFAULT 'absensi'
)
RETURNS TABLE (id uuid, nama text, prodi_nama text)
LANGUAGE sql
STABLE
AS $$
  SELECT m.id,
         m.nama,
         COALESCE(p.nama, '-')
  FROM mahasiswa m
  LEFT JOIN prodi p ON p.id = m.prodi_id
  WHERE
    -- Guard: for_type selain absensi/feedback -> hasil kosong
    search_mahasiswa.for_type IN ('absensi', 'feedback')

    -- Pencarian nama (pakai index trgm: idx_mahasiswa_nama_trgm)
    AND m.nama_normalized ILIKE '%' || search_mahasiswa.q || '%'

    -- Kecualikan yang sudah ABSENSI hari ini (kalau for_type = absensi)
    AND (
      search_mahasiswa.for_type <> 'absensi'
      OR NOT EXISTS (
        SELECT 1 FROM attendance a
        WHERE a.mahasiswa_id = m.id
          AND a.day = search_mahasiswa.day
      )
    )

    -- Kecualikan yang sudah FEEDBACK hari ini (kalau for_type = feedback)
    AND (
      search_mahasiswa.for_type <> 'feedback'
      OR NOT EXISTS (
        SELECT 1 FROM feedback f
        WHERE f.mahasiswa_id = m.id
          AND f.day = search_mahasiswa.day
      )
    )
  ORDER BY m.nama
  LIMIT 30;
$$;

-- Anon tidak boleh memanggil function ini langsung dari luar;
-- hanya service_role (API route) dan authenticated.
REVOKE EXECUTE ON FUNCTION search_mahasiswa(text, int, text) FROM anon;

COMMENT ON FUNCTION search_mahasiswa(text, int, text) IS
  'Pencarian mahasiswa untuk form publik: filter nama + exclude yang sudah absensi/feedback di hari tertentu. LIMIT 30 dikunci di dalam.';

-- ── (Verifikasi) Tes manual setelah RUN:
-- SELECT * FROM search_mahasiswa('an', 1, 'absensi');
-- Harusnya: maksimal 30 baris (id, nama, prodi_nama).
-- Bandingkan: ganti 'absensi' -> 'feedback' untuk form feedback.
