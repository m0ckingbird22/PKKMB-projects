import type {
  AttendanceRecord,
  AttendanceMode,
  AttendanceStatus,
} from "@/lib/types";

interface MahasiswaTableProps {
  records: AttendanceRecord[];
}

const MODE_BADGE: Record<AttendanceMode, string> = {
  offline: "bg-emerald-50 text-emerald-700",
  online: "bg-sky-50 text-sky-700",
};

const STATUS_BADGE: Record<AttendanceStatus, string> = {
  hadir: "bg-emerald-50 text-emerald-700",
  flagged: "bg-amber-50 text-amber-700",
};

const TH_CLASS =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-widertext-gray-500";

const TD_BASE = "whitespace-nowrap px-4 py-3 text-sm";

export function MahasiswaTable({ records }: MahasiswaTableProps) {
  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm text-gray-500">Tidak ada data mahasiswa.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className={TH_CLASS}>NIM</th>
            <th className={TH_CLASS}>Nama</th>
            <th className={TH_CLASS}>Prodi</th>
            <th className={`${TH_CLASS} hidden md:table-cell`}>Fakultas</th>
            <th className={TH_CLASS}>Mode</th>
            <th className={TH_CLASS}>Waktu</th>
            <th className={TH_CLASS}>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {records.map((r) => (
            <tr key={r.nim} className="hover:bg-gray-50">
              <td className={`${TD_BASE} font-medium text-gray-900`}>
                {r.nim}
              </td>
              <td className={`${TD_BASE} text-gray-900`}>{r.nama}</td>
              <td className={`${TD_BASE} text-gray-600`}>{r.prodi}</td>
              <td className={`${TD_BASE} hidden text-gray-600 md:table-cell`}>
                {r.fakultas}
              </td>
              <td className={TD_BASE}>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs 
  font-medium capitalize ${MODE_BADGE[r.mode]}`}
                >
                  {r.mode}
                </span>
              </td>
              <td className={`${TD_BASE} text-gray-600`}>{r.waktuAbsen}</td>
              <td className={TD_BASE}>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs 
  font-medium capitalize ${STATUS_BADGE[r.status]}`}
                >
                  {r.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
