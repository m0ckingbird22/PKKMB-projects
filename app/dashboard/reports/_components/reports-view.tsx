"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Users,
  CheckCircle2,
  XCircle,
  MessageSquare,
  FileDown,
  Loader2,
} from "lucide-react";
import { DayPicker } from "@/components/dashboard/day-picker";
import { ProdiPicker } from "@/components/dashboard/prodi-picker";
import { generateReportPDF } from "../_lib/generate-pdf";

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

interface RosterStudent {
  id: string;
  nama: string;
  days: number[];
}

interface Prodi {
  id: string;
  nama: string;
}

interface Props {
  day: number;
  prodiList: Prodi[];
  selectedProdi: string;
  prodiReports: ProdiReport[];
  absentStudents: AbsentStudent[];
  rosterStudents: RosterStudent[];
  stats: {
    totalMahasiswa: number;
    totalHadir: number;
    totalBelum: number;
    totalFeedback: number;
  };
}

const TH_BASE =
  "px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap";
const TD_BASE = "px-3 py-2.5 text-sm align-top";

export function ReportsView({
  day,
  prodiList,
  selectedProdi,
  prodiReports,
  absentStudents,
  rosterStudents,
  stats,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [exporting, setExporting] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Param dibaca dari window.location.search (selalu fresh), bukan dari hook
  // searchParams yang bisa masih versi lama saat navigasi sebelumnya belum selesai.
  function selectDay(d: number) {
    const params = new URLSearchParams(window.location.search);
    params.set("day", String(d));
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function selectProdi(value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set("prodi", value);
    } else {
      params.delete("prodi");
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  async function handleExportPDF() {
    setExporting(true);
    try {
      // Kasih delay kecil biar spinner sempat tampil
      await new Promise((r) => setTimeout(r, 50));
      const prodiFilterNama =
        selectedProdi === ""
          ? "Semua Prodi"
          : prodiList.find((p) => p.id === selectedProdi)?.nama ?? "Semua Prodi";
      generateReportPDF({
        day,
        prodiNama: prodiFilterNama,
        rosterStudents,
      });
    } catch (e) {
      console.error("PDF export error:", e);
      alert("Gagal generate PDF. Coba lagi.");
    } finally {
      setExporting(false);
    }
  }

  const statCards = [
    {
      label: "Total Mahasiswa",
      value: stats.totalMahasiswa,
      icon: Users,
    },
    {
      label: "Total Hadir",
      value: stats.totalHadir,
      icon: CheckCircle2,
    },
    {
      label: "Belum Hadir",
      value: stats.totalBelum,
      icon: XCircle,
    },
    {
      label: "Total Feedback",
      value: stats.totalFeedback,
      icon: MessageSquare,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filter hari + prodi + Export */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <DayPicker value={day} onChange={selectDay} />
          <div className="w-full">
            <h2 className="mb-3 text-sm font-semibold text-gray-300">
              PILIH PRODI
            </h2>
            <ProdiPicker
              value={selectedProdi}
              onChange={selectProdi}
              prodiList={prodiList}
            />
          </div>
        </div>

        <button
          onClick={handleExportPDF}
          disabled={exporting || isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-ember px-4 py-2.5 text-sm font-semibold text-twilight transition hover:bg-inferno hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          {exporting ? "Generating..." : "Export PDF"}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-lg border border-gray-800 bg-[#1d1c1c] p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">{label}</p>
                <p className="mt-1 text-2xl font-bold text-white">{value}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ember">
                <Icon className="h-5 w-5 text-inferno" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section 1: Rekap Kehadiran per Prodi */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-300">
          REKAP KEHADIRAN PER PRODI
        </h2>
        <div className="overflow-x-auto rounded-lg border border-gray-800 bg-[#1d1c1c]">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800/50">
              <tr>
                <th className={TH_BASE}>No</th>
                <th className={TH_BASE}>Prodi</th>
                <th className={`${TH_BASE} text-center`}>Total</th>
                <th className={`${TH_BASE} text-center`}>Hadir</th>
                <th className={`${TH_BASE} text-center`}>Belum</th>
                <th className={`${TH_BASE} text-center`}>%</th>
                <th className={`${TH_BASE} text-center`}>Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {prodiReports.map((p, i) => (
                <tr key={p.id} className="hover:bg-gray-800/50">
                  <td className={`${TD_BASE} text-gray-500`}>{i + 1}</td>
                  <td className={`${TD_BASE} font-medium text-white`}>
                    {p.nama}
                  </td>
                  <td className={`${TD_BASE} text-center text-gray-300`}>
                    {p.totalMahasiswa}
                  </td>
                  <td className={`${TD_BASE} text-center font-medium text-emerald-400`}>
                    {p.hadir}
                  </td>
                  <td className={`${TD_BASE} text-center font-medium text-inferno`}>
                    {p.belumHadir}
                  </td>
                  <td className={`${TD_BASE} text-center text-gray-300`}>
                    {p.persentase}%
                  </td>
                  <td className={`${TD_BASE} text-center font-medium text-amber-400`}>
                    {p.feedbackCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Daftar Mahasiswa Tidak Hadir */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-300">
          DAFTAR MAHASISWA TIDAK HADIR ({absentStudents.length})
        </h2>
        {absentStudents.length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-[#1d1c1c] p-8 text-center">
            <p className="text-sm text-gray-400">
              Tidak ada mahasiswa yang belum hadir pada filter ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-800 bg-[#1d1c1c]">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className={TH_BASE}>No</th>
                  <th className={TH_BASE}>Nama</th>
                  <th className={TH_BASE}>Prodi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {absentStudents.map((m, i) => (
                  <tr key={m.id} className="hover:bg-gray-800/50">
                    <td className={`${TD_BASE} text-gray-500`}>{i + 1}</td>
                    <td className={`${TD_BASE} font-medium text-white`}>
                      {m.nama}
                    </td>
                    <td className={`${TD_BASE} text-gray-300`}>{m.prodiNama}</td>
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
