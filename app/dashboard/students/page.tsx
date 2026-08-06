import { createClient } from "@/lib/supabase-server";
import { StudentsFilter } from "./_components/student-filter";
import { StudentsTable } from "./_components/student-table";

const PAGE_SIZE = 20;

interface SearchParams {
  search?: string;
  prodi?: string;
  page?: string;
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();

  const search = searchParams.search ?? "";
  const prodiFilter = searchParams.prodi ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1"));

  // ── Query mahasiswa dengan filter
  let query = supabase
    .from("mahasiswa")
    .select("id, nama, email, prodi:prodi_id(nama, fakultas)", {
      count: "exact",
    });

  // Filter search: nama atau email (case-insensitive)
  if (search) {
    query = query.or(`nama.ilike.%${search}%,email.ilike.%${search}%`);
  }

  // Filter prodi
  if (prodiFilter) {
    query = query.eq("prodi_id", prodiFilter);
  }

  // Pagination + sorting
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: students, count } = await query
    .order("nama", { ascending: true })
    .range(from, to);

  // ── Fetch semua prodi untuk dropdown filter
  const { data: prodiList } = await supabase
    .from("prodi")
    .select("id, nama, fakultas")
    .order("fakultas", { ascending: true });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Mahasiswa</h1>
        <p className="text-gray-500 text-sm mt-1">
          Daftar mahasiswa peserta PKKMB Universitas Cakrawala
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl border border-gray-200">
        {/* Filter */}
        <div className="px-6 py-4 border-b border-gray-100">
          <StudentsFilter prodiList={prodiList ?? []} totalCount={count ?? 0} />
        </div>

        {/* Table */}
        <StudentsTable
          students={students ?? []}
          totalCount={count ?? 0}
          page={page}
          pageSize={PAGE_SIZE}
        />
      </div>
    </div>
  );
}
