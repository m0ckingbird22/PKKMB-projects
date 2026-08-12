import { createClient } from "@/lib/supabase-server";
import { AttendanceView } from "./_components/attendance-view";

type AttendanceRow = {
  id: string;
  mode: string;
  submitted_at: string | null;
  is_flagged: boolean | null;
  foto_url: string;
  mahasiswa: {
    nama: string;
    prodi: { nama: string; fakultas: string | null } | null;
  } | null;
};

export const dynamic = "force-dynamic";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: { day?: string };
}) {
  const supabase = await createClient();

const urlDay = searchParams.day ?
  Number(searchParams.day) : null;
    const isValidDay =
      urlDay !== null && !isNaN(urlDay) && urlDay >= 1 &&
  urlDay <= 6;

    let currentDay: number;
    if (isValidDay) {
      // Fast path: URL sudah specify day, ga perlu query session
      currentDay = urlDay as number;
    } else {
      // Slow path: ambil day dari sesi terbaru
      const { data: latestSession } = await supabase
        .from("qr_session")
        .select("day")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      currentDay = latestSession?.day ?? 1;
    }

  // Fetch attendance hari itu, join mahasiswa + prodi
  const { data: records } = await supabase
    .from("attendance")
    .select(
      `
        id,
        mode,
        submitted_at,
        is_flagged,
        foto_url,
        mahasiswa:mahasiswa_id (nama, prodi:prodi_id (nama, fakultas))
      `,
    )
    .eq("day", currentDay)
    .order("submitted_at", { ascending: false });

  // Hitung statistik
  const all = (records ?? []) as unknown as AttendanceRow[];
  const offline = all.filter((r) => r.mode === "offline").length;
  const online = all.filter((r) => r.mode === "online").length;
  const flagged = all.filter((r) => r.is_flagged).length;

  // Group per prodi
  const prodiMap = new Map<
    string,
    { nama: string; fakultas: string; jumlah: number }
  >();
  for (const r of all) {
    const prodiNama = r.mahasiswa?.prodi?.nama ?? "Lainnya";
    const fakultas = r.mahasiswa?.prodi?.fakultas ?? "-";
    const existing = prodiMap.get(prodiNama) ?? {
      nama: prodiNama,
      fakultas,
      jumlah: 0,
    };
    existing.jumlah += 1;
    prodiMap.set(prodiNama, existing);
  }

  // Transform ke AttendanceRecord[]
  const formatted = all.map((r) => ({
    id: r.id,
    nama: r.mahasiswa?.nama ?? "-",
    prodi: r.mahasiswa?.prodi?.nama ?? "-",
    fakultas: r.mahasiswa?.prodi?.fakultas ?? "-",
    mode: r.mode as "offline" | "online",
    waktuAbsen: r.submitted_at
      ? new Date(r.submitted_at).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-",
    status: r.is_flagged ? ("flagged" as const) : ("hadir" as const),
    fotoUrl: r.foto_url,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Absensi</h1>
        <p className="text-gray-500 text-sm mt-1">Hari {currentDay}</p>
      </div>

      <AttendanceView
        initialRecords={formatted}
        prodiStats={Array.from(prodiMap.values())}
        day={currentDay}
        stats={{ totalHadir: all.length, offline, online, flagged }}
      />
    </div>
  );
}
