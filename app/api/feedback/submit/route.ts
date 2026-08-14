import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

const RATING_KEYS = [
  "q1_materi",
  "q2_narasumber",
  "q3_panitia",
  "q4_jadwal",
  "q5_fasilitas",
  "q6_puas",
] as const;

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();

  const body = await req.json();
  const token = body.token as string;
  const studentId = body.student_id as string;
  const kelebihan = (body.kelebihan as string | undefined)?.trim() || null;
  const saran = (body.saran as string | undefined)?.trim() || null;

  // ── Validasi input dasar
  if (!token || !studentId) {
    return NextResponse.json(
      { error: "Field tidak lengkap" },
      { status: 400 },
    );
  }

  // ── Validasi 6 rating Likert (wajib 1-5)
  const ratings: Record<string, number> = {};
  for (const key of RATING_KEYS) {
    const value = Number(body[key]);
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return NextResponse.json(
        { error: `Rating untuk ${key} tidak valid (harus 1-5)` },
        { status: 400 },
      );
    }
    ratings[key] = value;
  }

  // ── Validasi token aktif & bertipe feedback
  const { data: session, error: sessionError } = await supabase
    .from("qr_session")
    .select("id, day, is_active, type")
    .eq("token", token)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Token tidak valid" }, { status: 404 });
  }
  if (!session.is_active) {
    return NextResponse.json(
      { error: "Sesi sudah berakhir" },
      { status: 403 },
    );
  }
  if (session.type !== "feedback") {
    return NextResponse.json(
      { error: "QR ini bukan untuk feedback" },
      { status: 400 },
    );
  }

  // ── Validasi mahasiswa exists
  const { data: mhs } = await supabase
    .from("mahasiswa")
    .select("id")
    .eq("id", studentId)
    .single();
  if (!mhs) {
    return NextResponse.json(
      { error: "Mahasiswa tidak ditemukan" },
      { status: 404 },
    );
  }

  // ── Insert ke tabel feedback
  const { error: insertError } = await supabase.from("feedback").insert({
    mahasiswa_id: studentId,
    day: session.day,
    ...ratings,
    kelebihan,
    saran,
    sumbitted_at: new Date().toISOString(),
  });

  if (insertError) {
    console.error("Insert error:", insertError);

    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "Kamu sudah mengisi feedback hari ini." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Gagal simpan feedback" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
