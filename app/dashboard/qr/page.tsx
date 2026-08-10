import { createClient } from "@/lib/supabase-server";
import { QrManager } from "./_components/qr-manager";

export const dynamic = "force-dynamic";        

export default async function QrPage() {
    const supabase = await createClient();

const { data: sessions } = await supabase
    .from("qr_session")
    .select("id, token, day, is_active, created_at, created_by")
    .order("created_at", { ascending: false })
    .limit(20);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QR Code Absensi</h1>
          <p className="text-gray-500 text-sm mt-1">
            Buat sesi QR untuk absensi mahasiswa PKKMB
          </p>
        </div>

        <QrManager
          sessions={sessions ?? []}
          origin={process.env.NEXT_PUBLIC_SITE_URL ?? ""}
        />
      </div>
    );
  }