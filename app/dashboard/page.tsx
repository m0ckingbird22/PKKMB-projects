import { createClient } from "@/lib/supabase-server";
import { DashboardView } from "./_components/dashboard-view";

export const dynamic = "force-dynamic";

type MahasiswaRow = {
  id: string;
  nama: string;
  prodi: { id: string; nama: string } | null;
};

type RecentRow = {
  id: string;
  created_at: string;
  mahasiswa: { nama: string; prodi: { nama: string } | null } | null;
};

type SessionRow = {
  id: string;
  day: number;
  is_active: boolean | null;
  type: string | null;
  created_at: string | null;
  panitia: { nama: string } | null;
};

const PAGE = 1000;

async function fetchAllMahasiswa(supabase: Awaited<ReturnType<typeof createClient>>) {
  const all: MahasiswaRow[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("mahasiswa")
      .select("id, nama, prodi:prodi_id(id, nama)")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as unknown as MahasiswaRow[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { day?: string };
}) {
  const supabase = await createClient();

  // Tentukan hari aktif dari sesi QR aktif / terbaru
  const { data: sessions } = await supabase
    .from("qr_session")
    .select("id, day, is_active, type, created_at, panitia:created_by(nama)")
    .order("created_at", { ascending: false })
    .limit(20);

  const sessionList = (sessions ?? []) as unknown as SessionRow[];
  const activeSession = sessionList.find((s) => s.is_active);

  // Hari bisa di-override via URL param ?day=X
  const urlDay = searchParams.day ? Number(searchParams.day) : null;
  const isValidDay =
    urlDay !== null && !isNaN(urlDay) && urlDay >= 1 && urlDay <= 6;
  const currentDay = isValidDay
    ? (urlDay as number)
    : (activeSession?.day ?? sessionList[0]?.day ?? 1);

  const [
    prodiRes,
    mahasiswaList,
    attendanceRows,
    feedbackCount,
    recentAttendance,
    recentFeedback,
  ] = await Promise.all([
    supabase.from("prodi").select("id, nama").order("nama"),
    fetchAllMahasiswa(supabase),
    (async () => {
      const all: { mahasiswa_id: string }[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from("attendance")
          .select("mahasiswa_id")
          .eq("day", currentDay)
          .range(from, from + PAGE - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < PAGE) break;
        from += PAGE;
      }
      return all;
    })(),
    supabase
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("day", currentDay),
    supabase
      .from("attendance")
      .select("id, created_at, mahasiswa:mahasiswa_id(nama, prodi:prodi_id(nama))")
      .eq("day", currentDay)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("feedback")
      .select("id, created_at, mahasiswa:mahasiswa_id(nama, prodi:prodi_id(nama))")
      .eq("day", currentDay)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const prodiList = prodiRes.data ?? [];
  const hadirIds = new Set(attendanceRows.map((a) => a.mahasiswa_id as string));

  const totalMahasiswa = mahasiswaList.length;
  const totalHadir = hadirIds.size;
  const totalBelum = totalMahasiswa - totalHadir;
  const persentaseHadir =
    totalMahasiswa > 0 ? Math.round((totalHadir / totalMahasiswa) * 100) : 0;
  const totalFeedback = feedbackCount.count ?? 0;

  // Top 3 prodi dengan kehadiran terendah (perlu di-push)
  const prodiTerendah = prodiList
    .map((p) => {
      const mhs = mahasiswaList.filter((m) => m.prodi?.id === p.id);
      const total = mhs.length;
      const hadir = mhs.filter((m) => hadirIds.has(m.id)).length;
      const persen = total > 0 ? Math.round((hadir / total) * 100) : 0;
      return {
        id: p.id,
        nama: p.nama,
        total,
        hadir,
        persen,
      };
    })
    .filter((p) => p.total > 0)
    .sort((a, b) => a.persen - b.persen)
    .slice(0, 3);

  // Timeline aktivitas terbaru (absensi + feedback + sesi QR di-merge)
  const recentAtt = (recentAttendance.data ?? []) as unknown as RecentRow[];
  const recentFb = (recentFeedback.data ?? []) as unknown as RecentRow[];
  const activities = [
    ...recentAtt.map((a) => ({
      id: a.id,
      type: "absensi" as const,
      title: a.mahasiswa?.nama ?? "-",
      subtitle: a.mahasiswa?.prodi?.nama ?? "-",
      waktu: a.created_at,
    })),
    ...recentFb.map((f) => ({
      id: f.id,
      type: "feedback" as const,
      title: f.mahasiswa?.nama ?? "-",
      subtitle: f.mahasiswa?.prodi?.nama ?? "-",
      waktu: f.created_at,
    })),
    ...sessionList.slice(0, 5).map((s) => ({
      id: s.id,
      type: "qr" as const,
      title: `Sesi QR ${s.type === "feedback" ? "Feedback" : "Absensi"} Hari ${s.day} dibuat`,
      subtitle: s.panitia?.nama ? `oleh ${s.panitia.nama}` : "",
      waktu: s.created_at ?? "",
    })),
  ]
    .filter((a) => a.waktu)
    .sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime())
    .slice(0, 10);

  return (
    <DashboardView
      currentDay={currentDay}
      activeSession={
        activeSession
          ? { type: activeSession.type, day: activeSession.day }
          : null
      }
      stats={{
        totalMahasiswa,
        totalHadir,
        totalBelum,
        persentaseHadir,
        totalFeedback,
      }}
      prodiTerendah={prodiTerendah}
      activities={activities}
    />
  );
}
