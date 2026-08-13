import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

type Mahasiswa = {
  id: string;
  nama: string;
  prodi: { nama: string } | null;
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim().toLocaleLowerCase();
  const dayParam = request.nextUrl.searchParams.get("day");
  const day = dayParam ? Number(dayParam) : null;
  const forType = request.nextUrl.searchParams.get("for") ?? "absensi";

  if (!q || q.length < 2) {
    return NextResponse.json({ students: [] });
  }

  const supabase = createAdminClient();

  let excludeIds: string[] = [];
  if (day !== null && !isNaN(day)) {
    const table = forType === "feedback" ? "feedback" : "attendance";
    const { data: existing } = await supabase
      .from(table)
      .select("mahasiswa_id")
      .eq("day", day);
    excludeIds = (existing ?? []).map((r) => r.mahasiswa_id);
  }

  let query = supabase
    .from("mahasiswa")
    .select("id,nama,prodi:prodi_id(nama)")
    .ilike("nama_normalized", `%${q}%`)
    .limit(10);

  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("SEARCH ERROR", error);
    return NextResponse.json({ error: "gagal mencari data" }, { status: 500 });
  }

  const students = (data as Mahasiswa[]).map((s) => ({
    id: s.id,
    nama: s.nama,
    prodi_nama: s.prodi?.nama ?? "-",
  }));

  return NextResponse.json({ students });
}
