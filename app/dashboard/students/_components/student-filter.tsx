"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

interface Prodi {
  id: string;
  nama: string;
  fakultas: string;
}

interface StudentsFilterProps {
  prodiList: Prodi[];
  totalCount: number;
}

export function StudentsFilter({ prodiList, totalCount }: StudentsFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      // Reset ke page 1 setiap kali filter berubah
      if (!("page" in updates)) params.set("page", "1");
      return params.toString();
    },
    [searchParams],
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    router.push(pathname + "?" + createQueryString({ search: e.target.value }));
  };

  const handleProdiFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(pathname + "?" + createQueryString({ prodi: e.target.value }));
  };

  const currentSearch = searchParams.get("search") ?? "";
  const currentProdi = searchParams.get("prodi") ?? "";

  // Group prodi by fakultas untuk dropdown
  const fakultasMap = prodiList.reduce<Record<string, Prodi[]>>(
    (acc, prodi) => {
      if (!acc[prodi.fakultas]) acc[prodi.fakultas] = [];
      acc[prodi.fakultas].push(prodi);
      return acc;
    },
    {},
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <p className="text-sm text-gray-500">
        <span className="font-semibold text-gray-900">{totalCount}</span>
        {" "}
        mahasiswa terdaftar
      </p>

      <div className="flex gap-2 w-full sm:w-auto">
        {/* Search */}
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            defaultValue={currentSearch}
            onChange={handleSearch}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Filter Prodi */}
        <div className="relative">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            defaultValue={currentProdi}
            onChange={handleProdiFilter}
            className="pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white cursor-pointer"
          >
            <option value="">Semua Prodi</option>
            {Object.entries(fakultasMap).map(([fakultas, prodis]) => (
              <optgroup key={fakultas} label={fakultas}>
                {prodis.map((prodi) => (
                  <option key={prodi.id} value={prodi.id}>
                    {prodi.nama}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
