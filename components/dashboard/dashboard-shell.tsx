"use client";

import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";

interface DashboardShellProps {
  panitiaName: string;
  panitiaRole: "admin" | "panitia";
  children: ReactNode;
}

export function DashboardShell({
  panitiaName,
  panitiaRole,
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      <Sidebar
        panitiaName={panitiaName}
        panitiaRole={panitiaRole}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar mobile */}
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-800 bg-black px-4 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Buka menu"
            className="rounded-lg p-2 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-white">PKKMB</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 sm:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
