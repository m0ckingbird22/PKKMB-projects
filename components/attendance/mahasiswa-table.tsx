"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import type {
  AttendanceRecord,
  AttendanceMode,
  AttendanceStatus,
} from "@/lib/types";

interface MahasiswaTableProps {
  records: AttendanceRecord[];
}

const MODE_BADGE: Record<AttendanceMode, string> = {
  offline: "bg-emerald-500/15 text-emerald-400",
  online: "bg-sky-500/15 text-sky-400",
};

const STATUS_BADGE: Record<AttendanceStatus, string> = {
  hadir: "bg-emerald-500/15 text-emerald-400",
  flagged: "bg-amber-500/15 text-amber-400",
};

const TH_CLASS =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400";
const TD_BASE = "whitespace-nowrap px-4 py-3 text-sm";

export function MahasiswaTable({ records }: MahasiswaTableProps) {
  // Override lokal biar toggle flag terasa instan (optimistic update)
  const [flagOverrides, setFlagOverrides] = useState<Record<string, boolean>>(
    {},
  );

  const isFlagged = (r: AttendanceRecord) =>
    flagOverrides[r.id] ?? r.status === "flagged";

  async function toggleFlag(r: AttendanceRecord) {
    const next = !isFlagged(r);
    setFlagOverrides((prev) => ({ ...prev, [r.id]: next }));
    try {
      const res = await fetch(`/api/attendance/${r.id}/flag`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagged: next }),
      });
      if (!res.ok) throw new Error("gagal");
    } catch {
      // Balikin kondisi semula kalau API gagal
      setFlagOverrides((prev) => ({ ...prev, [r.id]: !next }));
    }
  }

  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 bg-[#1d1c1c] p-8 text-center">
        <p className="text-sm text-gray-400">Tidak ada data mahasiswa.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-800 bg-[#1d1c1c]">
      <table className="min-w-full divide-y divide-gray-800">
        <thead className="bg-gray-800/50">
          <tr>
            <th className={TH_CLASS}>Foto</th>
            <th className={TH_CLASS}>Nama</th>
            <th className={TH_CLASS}>Prodi</th>
            <th className={TH_CLASS}>Mode</th>
            <th className={TH_CLASS}>Waktu</th>
            <th className={TH_CLASS}>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {records.map((r) => {
            const flagged = isFlagged(r);
            return (
              <tr
                key={r.id}
                className={`transition-colors ${
                  flagged
                    ? "bg-amber-500/5 hover:bg-amber-500/10"
                    : "hover:bg-gray-800/50"
                }`}
              >
                <td className={TD_BASE}>
                  {r.fotoUrl ? (
                    <a href={r.fotoUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={r.fotoUrl}
                        alt={`Foto ${r.nama}`}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    </a>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-700" />
                  )}
                </td>
                <td className={`${TD_BASE} font-medium text-white`}>{r.nama}</td>
                <td className={`${TD_BASE} text-gray-300`}>{r.prodi}</td>
                <td className={TD_BASE}>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${MODE_BADGE[r.mode]}`}
                  >
                    {r.mode}
                  </span>
                </td>
                <td className={`${TD_BASE} text-gray-300`}>{r.waktuAbsen}</td>
                <td className={TD_BASE}>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[flagged ? "flagged" : "hadir"]}`}
                    >
                      {flagged ? "flagged" : "hadir"}
                    </span>
                    <button
                      onClick={() => toggleFlag(r)}
                      title={
                        flagged
                          ? r.flagReason
                            ? `Ditandai: ${r.flagReason} — klik untuk hapus tanda`
                            : "Ditandai janggal — klik untuk hapus tanda"
                          : "Tandai sebagai janggal"
                      }
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                        flagged
                          ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                          : "text-gray-500 hover:bg-gray-800 hover:text-amber-400"
                      }`}
                    >
                      <Flag
                        className={`h-3.5 w-3.5 ${flagged ? "fill-current" : ""}`}
                      />
                      {flagged ? "Batal" : "Tandai"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
