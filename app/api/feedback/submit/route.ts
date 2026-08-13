import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

const KATEGORI_VALID = [
  "Materi",
  "Pembicara",
  "Panitia",
  "Acara",
  "Suasana",
];

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();

  const body = await req.json();
  const token = body.token as string;
  const studentId = body.student_id as string;
  const rating = Number(body.rating);
  const kategori = body.kategori as string;
  const komentar = (body.komentar as string | undefined)?.trim() || null;

  // ── Validasi input
  if (!token || !studentId || !rating || !kategori) {
    return NextResponse.json({ error: "Field tidak lengkap" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating tidak valid" }, { status: 400 });
  }
  if (!KATEGORI_VALID.includes(kategori)) {
    return NextResponse.json({ error: "Kategori tidak valid" }, { status: 400 });
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
    return NextResponse.json({ error: "Sesi sudah berakhir" }, { status: 403 });
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
    rating,
    kategori,
    komentar,
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
