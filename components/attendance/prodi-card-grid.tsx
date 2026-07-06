import type { ProdiStat } from "@/lib/types";

interface ProdiCardGridProps {
  prodiList: ProdiStat[];
  activeProdi: string | null;
  onSelectProdi: (prodi: string | null) => void;
}

export function ProdiCardGrid({
  prodiList,
  activeProdi,
  onSelectProdi,
}: ProdiCardGridProps) {
  if (prodiList.length === 0) {
    return <p className="text-sm text-gray-500">Tidak ada data prodi.</p>;
  }

  return (
    <div>
      {activeProdi && (
        <button
          type="button"
          onClick={() => onSelectProdi(null)}
          className="mb-3 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          ← Tampilkan semua prodi
        </button>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {prodiList.map((prodi) => {
          const isActive = activeProdi === prodi.nama;
          const cardClass = isActive
            ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500"
            : "border-gray-200 bg-white hover:border-indigo-300hover:bg-indigo-50/50";
          const badgeClass = isActive
            ? "bg-indigo-600 text-white"
            : "bg-indigo-50 text-indigo-700";

          return (
            <button
              key={prodi.nama}
              type="button"
              onClick={() => onSelectProdi(isActive ? null : prodi.nama)}
              className={`text-left rounded-lg border p-4 transition-colors ${cardClass}`}
            >
              <span className="flex items-start justify-between gap-2">
                <span className="font-semibold text-gray-900 text-smleading-tight">
                  {prodi.nama}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xsfont-medium ${badgeClass}`}
                >
                  {prodi.jumlah}
                </span>
              </span>
              <span className="mt-1 block text-xs text-gray-500">
                {prodi.fakultas}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
