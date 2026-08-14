import { redirect } from "next/navigation";
import { createClient, getUserIdFromHeader } from "@/lib/supabase-server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AutoLogout } from "@/components/dashboard/auto-logout";

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
    <DashboardShell
      panitiaName={panitia!.nama}
      panitiaRole={panitia!.role as "admin" | "panitia"}
    >
      <AutoLogout />
      {children}
    </DashboardShell>
  );
}
