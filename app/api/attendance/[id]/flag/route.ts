import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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

  const body = await req.json().catch(() => null);
  if (!body || typeof body.flagged !== "boolean") {
    return NextResponse.json(
      { error: "Body harus berisi { flagged: boolean }" },
      { status: 400 },
    );
  }

  const values = body.flagged
    ? {
        is_flagged: true,
        flag_reason:
          typeof body.reason === "string" && body.reason.trim()
            ? body.reason.trim()
            : null,
        flagged_at: new Date().toISOString(),
        flagged_by: panitia.id,
      }
    : {
        is_flagged: false,
        flag_reason: null,
        flagged_at: null,
        flagged_by: null,
      };

  // UPDATE pakai admin client (service_role) karena tabel attendance
  // diatur RLS-nya tanpa policy UPDATE untuk user biasa — sama seperti API submit
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("attendance")
    .update(values)
    .eq("id", params.id)
    .select("id, is_flagged, flag_reason, flagged_at")
    .single();

  if (error) {
    console.error("Flag update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
