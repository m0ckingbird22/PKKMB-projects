import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

type Mahasiswa = {
  id: string;
  nama: string;
  prodi: { nama: string } | null;
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim().toLocaleLowerCase();

  if (!q || q.length < 2) {
    return NextResponse.json({ mahasiswa: [] });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("mahasiswa")
    .select("id,nama,prodi:prodi_id(nama)")
    .ilike("nama_normalized", `%${q}%`)
    .limit(10);

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
