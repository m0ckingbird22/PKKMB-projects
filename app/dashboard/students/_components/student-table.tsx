"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ProdiData = { nama: string; fakultas: string };

interface Student {
  id: string;
  nama: string;
  email: string | null;
  prodi: ProdiData | ProdiData[] | null;
}

interface StudentsTableProps {
  students: Student[];
  totalCount: number;
  page: number;
  pageSize: number;
}

function getProdi(prodi: Student["prodi"]): ProdiData | null {
  if (!prodi) return null;
  if (Array.isArray(prodi)) return prodi[0] ?? null;
  return prodi;
}

export function StudentsTable({
  students,
  totalCount,
  page,
  pageSize,
}: StudentsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(totalCount / pageSize);

  const goToPage = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", newPage.toString());
      router.push(pathname + "?" + params.toString());
    },
    [router, pathname, searchParams],
  );

  if (students.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg font-medium">Tidak ada mahasiswa ditemukan</p>
        <p className="text-sm mt-1">
          Coba ubah filter atau kata kunci pencarian
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                No
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Program Studi
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fakultas
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {students.map((student, index) => {
              const prodi = getProdi(student.prodi);
              return (
                <tr
                  key={student.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {(page - 1) * pageSize + index + 1}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {student.nama}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">
                    {student.email ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-indigo-600 font-medium">
                    {prodi?.nama ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {prodi?.fakultas ?? "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-2">
          <p className="text-xs text-gray-500">
            Menampilkan{" "}
            <span className="font-medium text-gray-700">
              {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, totalCount)}
            </span>{" "}
            dari <span className="font-medium text-gray-700">{totalCount}</span>{" "}
            mahasiswa
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
              )
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-2 text-gray-400 text-xs"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p as number)}
                    className={`w-8 h-8 text-xs rounded-lg transition-colors ${p === page ? "bg-indigo-600 text-white font-medium" : "text-gray-600 hover:bg-gray-100"}`}
                  >
                    {p}
                  </button>
                ),
              )}
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
