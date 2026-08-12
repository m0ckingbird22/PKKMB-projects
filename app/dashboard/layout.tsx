import { redirect } from "next/navigation";
import { createClient, getUserIdFromHeader } from "@/lib/supabase-server";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getUserIdFromHeader();

  if (!userId) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: panitia, error: panitiaError } = await supabase
    .from("panitia")
    .select("nama, role")
    .eq("id", userId)
    .single();

  if (panitiaError || !panitia) {
    console.error("Panitia error:", panitiaError);
    redirect("/login?error=unauthorized");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        panitiaName={panitia!.nama}
        panitiaRole={panitia!.role as "admin" | "panitia"}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-8">{children}</div>
      </main>
    </div>
  );
}
