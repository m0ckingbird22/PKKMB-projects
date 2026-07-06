"use client";                                                                     
                                         
  import { useMemo, useState } from "react";
  import { MOCK_ATTENDANCE, MOCK_PRODI_LIST } from "@/lib/mock-data";
  import { StatCards } from "@/components/attendance/stat-cards";
  import { ProdiCardGrid } from "@/components/attendance/prodi-card-grid";
  import { MahasiswaTable } from "@/components/attendance/mahasiswa-table";

  export default function AttendancePage() {
    const [activeProdi, setActiveProdi] = useState<string | null>(null);

    const filteredRecords = useMemo(() => {
      if (!activeProdi) return MOCK_ATTENDANCE;
      return MOCK_ATTENDANCE.filter((r) => r.prodi === activeProdi);
    }, [activeProdi]);

    const stats = useMemo(() => {
      return {
        totalHadir: filteredRecords.length,
        offline: filteredRecords.filter((r) => r.mode === "offline").length,
        online: filteredRecords.filter((r) => r.mode === "online").length,
        flagged: filteredRecords.filter((r) => r.status === "flagged").length,
      };
    }, [filteredRecords]);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Absensi Mahasiswa</h1>
          <p className="mt-1 text-sm text-gray-500">
            Daftar mahasiswa yang sudah melakukan absensi PKKMB.
          </p>
        </div>

        <StatCards {...stats} />

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              Filter berdasarkan prodi
            </h2>
            {activeProdi && (
              <span className="text-sm text-gray-500">
                Menampilkan:{" "}
                <span className="font-medium text-indigo-600">{activeProdi}</span>
              </span>
            )}
          </div>
          <ProdiCardGrid
            prodiList={MOCK_PRODI_LIST}
            activeProdi={activeProdi}
            onSelectProdi={setActiveProdi}
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              Daftar mahasiswa
              <span className="ml-2 text-gray-400">
                ({filteredRecords.length} mahasiswa)
              </span>
            </h2>
          </div>
          <MahasiswaTable records={filteredRecords} />
        </section>
      </div>
    );
  }