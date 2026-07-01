"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  QrCode,
  ClipboardCheck,
  MessageSquare,
  FileSpreadsheet,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Data Mahasiswa", href: "/dashboard/students", icon: Users },
  { label: "QR Code", href: "/dashboard/qr", icon: QrCode },
  { label: "Absensi", href: "/dashboard/attendance", icon: ClipboardCheck },
  { label: "Feedback", href: "/dashboard/feedback", icon: MessageSquare },
  { label: "Laporan", href: "/dashboard/reports", icon: FileSpreadsheet },
] as const;

interface SidebarProps {
  panitiaName: string;
  panitiaRole: "admin" | "panitia";
}

export function Sidebar({ panitiaName, panitiaRole }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <span className="text-lg font-semibold text-gray-900">PKKMB</span>
        <span className="ml-1 text-sm text-gray-400">Cakrawala</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          // exact match for dashboard root, prefix match for the rest
          // so /dashboard/students/123 still highlights "Data Mahasiswa"
          const isActive =
            href === "/dashboard"
              ? pathname === href
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer — user info */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
            {panitiaName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">
              {panitiaName}
            </p>
            <p className="text-xs capitalize text-gray-500">{panitiaRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
