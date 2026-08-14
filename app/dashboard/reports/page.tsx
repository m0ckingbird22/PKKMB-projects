import { createClient } from "@/lib/supabase-server";
import { ReportsView } from "./_components/reports-view";

export const dynamic = "force-dynamic";

interface ProdiReport {
  id: string;
  nama: string;
  totalMahasiswa: number;
  hadir: number;
  belumHadir: number;
  persentase: number;
  feedbackCount: number;
}

interface AbsentStudent {
  id: string;
  nama: string;
  prodiNama: string;
}

type MahasiswaRow = {
  id: string;
  nama: string;
  prodi: { id: string; nama: string } | null;
};

type FeedbackRow = {
  mahasiswa: { prodi_id: string } | null;
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { day?: string; prodi?: string };
}) {
  const supabase = await createClient();

  const urlDay = searchParams.day ? Number(searchParams.day) : null;
  const isValidDay =
    urlDay !== null && !isNaN(urlDay) && urlDay >= 1 && urlDay <= 6;
  const prodiFilter = searchParams.prodi ?? "";

  let currentDay: number;
  if (isValidDay) {
    currentDay = urlDay as number;
  } else {
    const { data: latestSession } = await supabase
      .from("qr_session")
      .select("day")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    currentDay = latestSession?.day ?? 1;
  }

  // Parallel fetch semua data yang dibutuhkan
  // Paginate queries karena Supabase default cap 1000 rows per query.
  // Tabel mahasiswa 1398 rows → harus dipagination.
  async function fetchAllMahasiswa() {
    const PAGE = 1000;
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

  async function fetchAllAttendance() {
    const PAGE = 1000;
    const all: { mahasiswa_id: string; day: number; is_flagged: boolean | null }[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from("attendance")
        .select("mahasiswa_id, day, is_flagged")
        .range(from, from + PAGE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      all.push(...data);
      if (data.length < PAGE) break;
      from += PAGE;
    }
    return all;
  }

  async function fetchAllFeedback() {
    const PAGE = 1000;
    const all: FeedbackRow[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from("feedback")
        .select("mahasiswa:mahasiswa_id(prodi_id)")
        .eq("day", currentDay)
        .range(from, from + PAGE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      all.push(...(data as unknown as FeedbackRow[]));
      if (data.length < PAGE) break;
      from += PAGE;
    }
    return all;
  }

  // Parallel fetch semua data yang dibutuhkan
  const [prodiRes, mahasiswaList, attendanceRows, feedbackRows] =
    await Promise.all([
      supabase.from("prodi").select("id, nama").order("nama"),
      fetchAllMahasiswa(),
      fetchAllAttendance(),
      fetchAllFeedback(),
    ]);

  const prodiList = prodiRes.data ?? [];

  // Set mahasiswa_id yang sudah hadir di hari ini
  const hadirIds = new Set(
    attendanceRows
      .filter((a) => a.day === currentDay)
      .map((a) => a.mahasiswa_id as string),
  );

  // Hari hadir tiap mahasiswa (untuk kolom 1-6 di PDF rekap)
  const daysByStudent = new Map<string, Set<number>>();
  for (const a of attendanceRows) {
    let set = daysByStudent.get(a.mahasiswa_id);
    if (!set) {
      set = new Set<number>();
      daysByStudent.set(a.mahasiswa_id, set);
    }
    set.add(a.day);
  }

  // Bangun rekap per prodi
  const prodiReports: ProdiReport[] = prodiList.map((p) => {
    const mhsInProdi = mahasiswaList.filter((m) => m.prodi?.id === p.id);
    const total = mhsInProdi.length;
    const hadir = mhsInProdi.filter((m) => hadirIds.has(m.id)).length;
    const belumHadir = total - hadir;
    const persentase = total > 0 ? Math.round((hadir / total) * 100) : 0;
    const feedbackCount = feedbackRows.filter(
      (f) => f.mahasiswa?.prodi_id === p.id,
    ).length;

    return {
      id: p.id,
      nama: p.nama,
      totalMahasiswa: total,
      hadir,
      belumHadir,
      persentase,
      feedbackCount,
    };
  });

  // Stat global
  const totalMahasiswa = mahasiswaList.length;
  const totalHadir = hadirIds.size;
  const totalBelum = totalMahasiswa - totalHadir;
  const totalFeedback = feedbackRows.length;

  // Roster mahasiswa prodi terpilih (urut nama) untuk export PDF.
  // Semua mahasiswa prodi itu ikut, tanda hadir per hari ada di `days`.
  const rosterStudents = mahasiswaList
    .filter((m) => prodiFilter === "" || m.prodi?.id === prodiFilter)
    .sort((a, b) => a.nama.localeCompare(b.nama, "id"))
    .map((m) => ({
      id: m.id,
      nama: m.nama,
      days: Array.from(daysByStudent.get(m.id) ?? new Set<number>()),
    }));

  // Daftar mahasiswa tidak hadir (filtered by prodi)
  const absentStudents: AbsentStudent[] = mahasiswaList
    .filter((m) => !hadirIds.has(m.id))
    .filter((m) => prodiFilter === "" || m.prodi?.id === prodiFilter)
    .map((m) => ({
      id: m.id,
      nama: m.nama,
      prodiNama: m.prodi?.nama ?? "-",
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Laporan</h1>
        <p className="text-sm text-gray-400 mt-1">Hari {currentDay}</p>
      </div>

      <ReportsView
        day={currentDay}
        prodiList={prodiList}
        selectedProdi={prodiFilter}
        prodiReports={prodiReports}
        absentStudents={absentStudents}
        rosterStudents={rosterStudents}
        stats={{
          totalMahasiswa,
          totalHadir,
          totalBelum,
          totalFeedback,
        }}
      />
    </div>
  );
}
