import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim().toLocaleLowerCase();
  const dayParam = request.nextUrl.searchParams.get("day");
  const day = dayParam ? Number(dayParam) : null;
  const forType = request.nextUrl.searchParams.get("for") ?? "absensi";

  if (!q || q.length < 2) {
    return NextResponse.json({ students: [] });
  }
  if (day === null || Number.isNaN(day)) {
    return NextResponse.json({ students: [] });
  }
  if (!["absensi", "feedback"].includes(forType)) {
    return NextResponse.json({ students: [] });
  }

  // 1 panggilan RPC: pencarian + filter "sudah absen/sudah feedback"
  // dikerjakan database (anti-join NOT EXISTS ber-index) — 1 round-trip,
  // tanpa kirim daftar UUID seperti versi NOT IN dulu.
  // Definisi function: supabase/search_mahasiswa_rpc.sql
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("search_mahasiswa", {
    q,
    day,
    for_type: forType,
  });

  if (error) {
    console.error("SEARCH ERROR", error);
    return NextResponse.json({ error: "gagal mencari data" }, { status: 500 });
  }

  return NextResponse.json({ students: data ?? [] });
}
