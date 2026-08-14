import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function PATCH(_req: NextRequest, { params }: { params: { id:
  string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ambil panitia id dari email user
  const { data: panitia } = await supabase
    .from("panitia")
    .select("id")
    .eq("email", user.email)
    .single();
  if (!panitia)
    return NextResponse.json({ error: "Panitia not found" }, { status: 403 });

  // UPDATE pakai admin client — sama seperti route flag & submit,
  // supaya gak ketolak policy RLS
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("qr_session")
    .update({ is_active: false })
    .eq("id", params.id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
