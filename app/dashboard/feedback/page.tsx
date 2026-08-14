import { createClient } from "@/lib/supabase-server";
import { FeedbackView } from "./_components/feedback-view";
import type { FeedbackRecord } from "@/lib/types";

type FeedbackRow = {
  id: string;
  q1_materi: number | null;
  q2_narasumber: number | null;
  q3_panitia: number | null;
  q4_jadwal: number | null;
  q5_fasilitas: number | null;
  q6_puas: number | null;
  kelebihan: string | null;
  saran: string | null;
  sumbitted_at: string | null;
  mahasiswa: {
    nama: string;
    prodi: { nama: string } | null;
  } | null;
};

export const dynamic = "force-dynamic";

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: { day?: string };
}) {
  const supabase = await createClient();

  const urlDay = searchParams.day ? Number(searchParams.day) : null;
  const isValidDay =
    urlDay !== null && !isNaN(urlDay) && urlDay >= 1 && urlDay <= 6;

  let currentDay: number;
  if (isValidDay) {
    currentDay = urlDay as number;
  } else {
    // Default: ambil day dari sesi feedback terbaru
    const { data: latestFeedbackSession } = await supabase
      .from("qr_session")
      .select("day")
      .eq("type", "feedback")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    currentDay = latestFeedbackSession?.day ?? 1;
  }

  // Fetch feedback hari itu + total mahasiswa (paralel)
  const [feedbackRes, totalMhsRes, filledRes] = await Promise.all([
    supabase
      .from("feedback")
      .select(
        `
        id,
        q1_materi,
        q2_narasumber,
        q3_panitia,
        q4_jadwal,
        q5_fasilitas,
        q6_puas,
        kelebihan,
        saran,
        sumbitted_at,
        mahasiswa:mahasiswa_id ( nama, prodi:prodi_id ( nama ) )
      `,
      )
      .eq("day", currentDay)
      .order("sumbitted_at", { ascending: false }),
    supabase.from("mahasiswa").select("id", { count: "exact", head: true }),
    supabase
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("day", currentDay),
  ]);

  const rawRows = (feedbackRes.data ?? []) as unknown as FeedbackRow[];
  const totalMahasiswa = totalMhsRes.count ?? 0;
  const sudahIsi = filledRes.count ?? 0;

  const records: FeedbackRecord[] = rawRows.map((r) => ({
    id: r.id,
    nama: r.mahasiswa?.nama ?? "-",
    prodi: r.mahasiswa?.prodi?.nama ?? "-",
    q1Materi: r.q1_materi ?? 0,
    q2Narasumber: r.q2_narasumber ?? 0,
    q3Panitia: r.q3_panitia ?? 0,
    q4Jadwal: r.q4_jadwal ?? 0,
    q5Fasilitas: r.q5_fasilitas ?? 0,
    q6Puas: r.q6_puas ?? 0,
    kelebihan: r.kelebihan,
    saran: r.saran,
    waktu: r.sumbitted_at
      ? new Date(r.sumbitted_at).toLocaleString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Feedback</h1>
        <p className="text-sm text-gray-400 mt-1">Hari {currentDay}</p>
      </div>

      <FeedbackView
        records={records}
        day={currentDay}
        stats={{
          totalMahasiswa,
          sudahIsi,
          belumIsi: Math.max(0, totalMahasiswa - sudahIsi),
        }}
      />
    </div>
  );
}
