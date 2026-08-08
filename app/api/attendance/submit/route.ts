import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const supabase = createAdminClient(); // service_role, bypass RLS

  const formData = await req.formData();
  const token = formData.get("token") as string;
  const studentId = formData.get("student_id") as string;
  const mode = formData.get("mode") as string;
  const photo = formData.get("photo") as File;

  // ── Validasi input
  if (!token || !studentId || !mode || !photo) {
    return NextResponse.json({ error: "Field tidak lengkap" }, { status: 400 });
  }
  if (!["offline", "online"].includes(mode)) {
    return NextResponse.json({ error: "Mode tidak valid" }, { status: 400 });
  }

  // ── Validasi token aktif
  const { data: session, error: sessionError } = await supabase
    .from("qr_session")
    .select("id, day, is_active")
    .eq("token", token)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Token tidak valid" }, { status: 404 });
  }
  if (!session.is_active) {
    return NextResponse.json({ error: "Sesi sudah berakhir" }, { status: 403 });
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

  // ── Upload foto ke Storage
  const ext = photo.name.split(".").pop() || "jpg";
  const fileName = `${session.day}/${studentId}-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("pkkmb-photos")
    .upload(fileName, photo, { contentType: photo.type });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return NextResponse.json({ error: "Gagal upload foto" }, { status: 500 });
  }

  // ── Dapat public URL
  const { data: urlData } = supabase.storage
    .from("pkkmb-photos")
    .getPublicUrl(fileName);

  // ── Insert ke tabel attendance
  const { error: insertError } = await supabase.from("attendance").insert({
    mahasiswa_id: studentId,
    day: session.day,
    mode,
    foto_url: urlData.publicUrl,
    is_flagged: false,
    submitted_at: new Date().toISOString(),
  });

  if (insertError) {
    console.error("Insert error:", insertError);
    return NextResponse.json(
      { error: "Gagal simpan absensi" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
