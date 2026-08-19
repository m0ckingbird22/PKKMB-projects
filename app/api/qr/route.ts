  import { NextRequest, NextResponse } from "next/server";
  import { createClient } from "@/lib/supabase-server";

  export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Ambil panitia id dari email user
    const { data: panitia } = await supabase
      .from("panitia").select("id").eq("email", user.email).single();
    if (!panitia) return NextResponse.json({ error: "Panitia not found" }, { status: 403 });

    const { day, type = "absensi" } = await req.json();

    if (!["absensi", "feedback"].includes(type)) {
      return NextResponse.json({ error: "Type tidak valid" }, { status: 400 });
    }

    // Generate token: PKKMB-D{day}-{HHMM} untuk absensi, PKKMB-F{day}-{HHMM} untuk feedback
    // HHMM wajib zona Asia/Jakarta — server Vercel berjalan di UTC,
    // getHours() akan menghasilkan jam UTC (19:33 WIB terbaca 12:33)
    const [hh, mm] = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .format(new Date())
      .split(":");
    const prefix = type === "feedback" ? "PKKMB-F" : "PKKMB-D";
    const token = `${prefix}${day}-${hh}${mm}`;

    const { data, error } = await supabase
      .from("qr_session")
      .insert({ token, day, type, is_active: true, created_by: panitia.id })
      .select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
