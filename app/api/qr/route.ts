  import { NextRequest, NextResponse } from "next/server";                      
  import { createClient } from "@/lib/supabase-server";

  export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401
   });

    // Ambil panitia id dari email user
    const { data: panitia } = await supabase
      .from("panitia").select("id").eq("email", user.email).single();
    if (!panitia) return NextResponse.json({ error: "Panitia not found" }, {
  status: 403 });

    const { day } = await req.json(); // 1, 2, atau 3

    // Generate token: PKKMB-D{day}-{HHMM}
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const token = `PKKMB-D${day}-${hh}${mm}`;

    const { data, error } = await supabase
      .from("qr_session")
      .insert({ token, day, is_active: true, created_by: panitia.id })
      .select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500
  });
    return NextResponse.json(data);
  }