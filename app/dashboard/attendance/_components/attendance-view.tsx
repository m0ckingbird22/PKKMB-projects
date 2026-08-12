"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { StatCards } from "@/components/attendance/stat-cards";
import { ProdiCardGrid } from "@/components/attendance/prodi-card-grid";
import { MahasiswaTable } from "@/components/attendance/mahasiswa-table";
import type { AttendanceRecord, ProdiStat } from "@/lib/types";
import { useState } from "react";

interface Props {
  initialRecords: AttendanceRecord[];
  prodiStats: ProdiStat[];
  day: number;
  stats: {
    totalHadir: number;
    offline: number;
    online: number;
    flagged: number;
  };
}

export function AttendanceView({
  initialRecords,
  prodiStats,
  stats,
  day,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeProdi, setActiveProdi] = useState<string | null>(null);

  function selectDay(d: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("day", String(d));
    router.push(`${pathname}?${params.toString()}`);
  }

  // ── Realtime: refresh data saat ada insert baru
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("attendance-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "attendance" },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "attendance" },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  // Filter records by selected prodi
  const filtered = activeProdi
    ? initialRecords.filter((r) => r.prodi === activeProdi)
    : initialRecords;

  return (
    <div className="space-y-6">
      {/* Filter hari */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">PILIH HARI</h2>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }, (_, i) => i + 1).map((d) => (
            <button
              key={d}
              onClick={() => selectDay(d)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                d === day
                  ? "border-twilight bg-twilight  text-white"
                  : "border-gray-300 text-gray-600 hover:border-twilight hover:text-twilight"
              }`}
            >
              Hari {d}
            </button>
          ))}
        </div>
      </div>
      <StatCards {...stats} />

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          FILTER PRODI
        </h2>
        <ProdiCardGrid
          prodiList={prodiStats}
          activeProdi={activeProdi}
          onSelectProdi={setActiveProdi}
        />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          DAFTAR HADIR {activeProdi && `• ${activeProdi}`}
        </h2>
        <MahasiswaTable records={filtered} />
      </div>
    </div>
  );
}
