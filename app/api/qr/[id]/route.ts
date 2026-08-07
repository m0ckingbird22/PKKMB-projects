import { NextResponse,NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";


export async function PATCH(_req: NextRequest, { params }: { params: { id:
  string } }) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("qr_session")
      .update({ is_active: false })
      .eq("id", params.id)
      .select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500
  });
    return NextResponse.json(data);
  }