"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search } from "lucide-react";
import { ProdiPicker } from "@/components/dashboard/prodi-picker";

interface Prodi {
  id: string;
  nama: string;
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
      if (!("page" in updates)) params.set("page", "1");
      return params.toString();
    },
    [searchParams],
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    router.push(pathname + "?" + createQueryString({ search: e.target.value }));
  };

  const handleProdiFilter = (value: string) => {
    router.push(pathname + "?" + createQueryString({ prodi: value }));
  };

  const currentSearch = searchParams.get("search") ?? "";
  const currentProdi = searchParams.get("prodi") ?? "";

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <p className="text-sm text-gray-400">
        <span className="font-semibold text-white">{totalCount}</span>{" "}
        mahasiswa terdaftar
      </p>

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            defaultValue={currentSearch}
            onChange={handleSearch}
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#2c2c2c] text-white placeholder-gray-500 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-twilight focus:border-transparent"
          />
        </div>

        {/* Filter Prodi */}
        <ProdiPicker
          value={currentProdi}
          onChange={handleProdiFilter}
          prodiList={prodiList}
        />
      </div>
    </div>
  );
}
