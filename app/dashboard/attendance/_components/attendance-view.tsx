"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { StatCards } from "@/components/attendance/stat-cards";
import { ProdiCardGrid } from "@/components/attendance/prodi-card-grid";
import { MahasiswaTable } from "@/components/attendance/mahasiswa-table";
import type { AttendanceRecord, ProdiStat } from "@/lib/types";
import { useState } from "react";
import { DayPicker } from "@/components/dashboard/day-picker";

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

  // ── Realtime: refresh data saat ada insert baru.
  // Di-throttle maks 1x / 15 detik biar gak render storm saat ramai.
  useEffect(() => {
    const supabase = createClient();
    let lastRefresh = 0;
    const maybeRefresh = () => {
      if (Date.now() - lastRefresh < 15_000) return;
      lastRefresh = Date.now();
      router.refresh();
    };
    const channel = supabase
      .channel("attendance-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "attendance" },
        maybeRefresh,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "attendance" },
        maybeRefresh,
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
      <DayPicker value={day} onChange={selectDay} />
      <StatCards {...stats} />

      <div>
        <h2 className="text-sm font-semibold text-gray-300 mb-3">
          FILTER PRODI
        </h2>
        <ProdiCardGrid
          prodiList={prodiStats}
          activeProdi={activeProdi}
          onSelectProdi={setActiveProdi}
        />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-300 mb-3">
          DAFTAR HADIR {activeProdi && `• ${activeProdi}`}
        </h2>
        <MahasiswaTable records={filtered} />
      </div>
    </div>
  );
}
