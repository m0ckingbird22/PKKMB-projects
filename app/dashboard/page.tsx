"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { useMemo } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []); // ← wrap useMemo

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard PKKMB</h1>
      <p className="text-gray-500 mt-1">
        Selamat datang di sistem registrasi PKKMB
      </p>
      <button
        onClick={handleLogout}
        className="mt-6 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
      >
        Logout
      </button>
    </div>
  );
}
