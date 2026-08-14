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
    return <p className="text-sm text-gray-400">Tidak ada data prodi.</p>;
  }

  return (
    <div>
      {activeProdi && (
        <button
          type="button"
          onClick={() => onSelectProdi(null)}
          className="mb-3 text-sm font-medium text-ember hover:text-inferno"
        >
          ← Tampilkan semua prodi
        </button>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {prodiList.map((prodi) => {
          const isActive = activeProdi === prodi.nama;
          const cardClass = isActive
            ? "border-twilight bg-twilight/10 ring-1 ring-twilight"
            : "border-gray-800 bg-[#1d1c1c] hover:border-twilight/50 hover:bg-gray-800/50";
          const badgeClass = isActive
            ? "bg-twilight text-white"
            : "bg-ember/15 text-ember";

          return (
            <button
              key={prodi.nama}
              type="button"
              onClick={() => onSelectProdi(isActive ? null : prodi.nama)}
              className={`text-left rounded-lg border p-4 transition-colors ${cardClass}`}
            >
              <span className="flex items-start justify-between gap-2">
                <span className="font-semibold text-white text-sm leading-tight">
                  {prodi.nama}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}
                >
                  {prodi.jumlah}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
