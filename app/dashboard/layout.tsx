import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { Sidebar } from "@/app/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: panitia, error: panitiaError } = await supabase
    .from("panitia")
    .select("nama, role")
    .eq("id", user.id) // ← non-null assertion
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
