"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { Users, CheckCircle2, XCircle } from "lucide-react";
import { DayPicker } from "@/components/dashboard/day-picker";
import type { FeedbackRecord } from "@/lib/types";

interface Props {
  records: FeedbackRecord[];
  day: number;
  stats: {
    totalMahasiswa: number;
    sudahIsi: number;
    belumIsi: number;
  };
}

const TH_BASE =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap";
const TD_BASE = "px-4 py-3 text-sm align-top";

// Warna badge berdasarkan nilai rating Likert
function ratingBadgeClass(value: number): string {
  if (value <= 0) return "bg-gray-700/50 text-gray-500";
  if (value <= 2) return "bg-inferno/20 text-inferno";
  if (value === 3) return "bg-amber-500/15 text-amber-400";
  return "bg-emerald-500/15 text-emerald-400";
}

export function FeedbackView({ records, day, stats }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function selectDay(d: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("day", String(d));
    router.push(`${pathname}?${params.toString()}`);
  }

  // Realtime: refresh saat ada insert feedback baru
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("feedback-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feedback" },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const statCards = [
    {
      label: "Total Mahasiswa",
      value: stats.totalMahasiswa,
      icon: Users,
      iconBg: "bg-ember",
      iconColor: "text-inferno",
    },
    {
      label: "Sudah Isi",
      value: stats.sudahIsi,
      icon: CheckCircle2,
      iconBg: "bg-ember",
      iconColor: "text-inferno",
    },
    {
      label: "Belum Isi",
      value: stats.belumIsi,
      icon: XCircle,
      iconBg: "bg-ember",
      iconColor: "text-inferno",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filter hari */}
      <DayPicker value={day} onChange={selectDay} />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map(({ label, value, icon: Icon, iconBg, iconColor }) => (
          <div
            key={label}
            className="rounded-lg border border-gray-800 bg-[#1d1c1c] p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">{label}</p>
                <p className="mt-1 text-2xl font-bold text-white">{value}</p>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}
              >
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabel rincian */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-300">
          DAFTAR FEEDBACK ({records.length})
        </h2>

        {records.length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-[#1d1c1c] p-8 text-center">
            <p className="text-sm text-gray-400">
              Belum ada feedback untuk hari ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-800 bg-[#1d1c1c]">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-[#454444]">
                <tr>
                  <th className={TH_BASE}>No</th>
                  <th className={TH_BASE}>Nama</th>
                  <th className={TH_BASE}>Prodi</th>
                  <th className={`${TH_BASE} text-center`}>Q1</th>
                  <th className={`${TH_BASE} text-center`}>Q2</th>
                  <th className={`${TH_BASE} text-center`}>Q3</th>
                  <th className={`${TH_BASE} text-center`}>Q4</th>
                  <th className={`${TH_BASE} text-center`}>Q5</th>
                  <th className={`${TH_BASE} text-center`}>Q6</th>
                  <th className={TH_BASE}>Kelebihan</th>
                  <th className={TH_BASE}>Saran</th>
                  <th className={TH_BASE}>Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {records.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-gray-800/50">
                    <td className={`${TD_BASE} text-gray-500`}>{idx + 1}</td>
                    <td className={`${TD_BASE} font-medium text-white`}>
                      {r.nama}
                    </td>
                    <td className={`${TD_BASE} text-gray-300`}>{r.prodi}</td>
                    {[
                      r.q1Materi,
                      r.q2Narasumber,
                      r.q3Panitia,
                      r.q4Jadwal,
                      r.q5Fasilitas,
                      r.q6Puas,
                    ].map((val, i) => (
                      <td key={i} className={`${TD_BASE} text-center`}>
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${ratingBadgeClass(
                            val,
                          )}`}
                        >
                          {val > 0 ? val : "-"}
                        </span>
                      </td>
                    ))}
                    <td
                      className={`${TD_BASE} max-w-[200px] text-gray-300`}
                      title={r.kelebihan ?? ""}
                    >
                      {r.kelebihan ? (
                        <p className="line-clamp-2 whitespace-normal break-words">
                          {r.kelebihan}
                        </p>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td
                      className={`${TD_BASE} max-w-[200px] text-gray-300`}
                      title={r.saran ?? ""}
                    >
                      {r.saran ? (
                        <p className="line-clamp-2 whitespace-normal break-words">
                          {r.saran}
                        </p>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className={`${TD_BASE} whitespace-nowrap text-gray-300`}>
                      {r.waktu}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
