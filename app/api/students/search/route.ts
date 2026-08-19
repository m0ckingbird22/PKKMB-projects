import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim().toLocaleLowerCase();
  const token = params.get("token");
  const forType = params.get("for") ?? "absensi";

  if (!q || q.length < 2) {
    return NextResponse.json({ students: [] });
  }
  if (!["absensi", "feedback"].includes(forType)) {
    return NextResponse.json({ students: [] });
  }
  if (!token) {
    return NextResponse.json({ error: "Token diperlukan" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Gerbang keamanan: hanya pemegang token QR aktif yang boleh mencari.
  // Tanpa ini, siapa pun bisa enumerasi data seluruh mahasiswa.
  const { data: session, error: sessionError } = await supabase
    .from("qr_session")
    .select("day, is_active, type")
    .eq("token", token)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Token tidak valid" }, { status: 404 });
  }
  if (!session.is_active) {
    return NextResponse.json({ error: "Sesi sudah berakhir" }, { status: 403 });
  }
  if (session.type !== forType) {
    return NextResponse.json({ error: "Token tidak cocok" }, { status: 400 });
  }

  // day diambil dari sesi di server, bukan dari query client
  // (dipakai RPC untuk filter "sudah absen/sudah feedback")
  // 1 panggilan RPC: definisi function di supabase/search_mahasiswa_rpc.sql
  const { data, error } = await supabase.rpc("search_mahasiswa", {
    q,
    day: session.day,
    for_type: forType,
  });

  if (error) {
    console.error("SEARCH ERROR", error);
    return NextResponse.json({ error: "gagal mencari data" }, { status: 500 });
  }

  return NextResponse.json({ students: data ?? [] });
}
