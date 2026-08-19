import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  // Cabut session di server Supabase (refresh token tidak bisa dipakai lagi)
  await supabase.auth.signOut();

  const res = NextResponse.redirect(new URL("/login", req.url));

  // Asuransi: hapus eksplisit semua cookie sb-*.
  // signOut() dari sisi browser kadang menyisakan cookie (terutama
  // cookie ter-chunk), sehingga session lama masih sah — kasus
  // "login email baru tapi masuk sebagai akun lama".
  req.cookies.getAll().forEach(({ name }) => {
    if (name.startsWith("sb-")) res.cookies.delete(name);
  });

  return res;
}
