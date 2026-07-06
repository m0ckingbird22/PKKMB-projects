"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  QrCode,
  ClipboardCheck,
  MessageSquare,
  FileSpreadsheet,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
  const router = useRouter();
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  };

  return (
    <aside
      className={`flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
        collapsed ? "w-16" : "w-48"
      }`}
    >
      {/* Brand */}
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center border-b border-gray-200 px-3 gap-2">
        <div className="flex shrink-0 items-center justify-center">
          {collapsed ? (
            // Collapsed: icon only
            <Image
              src="/logo.png"
              alt="Logo Cakrawala"
              width={32}
              height={32}
              className="object-contain"
            />
          ) : (
            // Expanded: logo full dengan teks
            <Image
              src="/cak-u-logo.png"
              alt="Logo PKKMB"
              width={110}
              height={60}
              className="rounded-lg object-cover"
            />
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === href
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              title={collapsed ? label : undefined}
              className={`flex items-center rounded-lg py-2 text-sm font-medium transition-colors ${
                collapsed ? "justify-center px-2" : "gap-3 px-3"
              } ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-gray-200 p-3 space-y-1">
        {/* Toggle button — di atas nama dapi */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`flex h-8 w-full items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors ${
            collapsed ? "justify-center px-2" : "gap-2 px-3"
          }`}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4 shrink-0" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>

        {/* User info + Logout */}
        {collapsed ? (
          <div className="flex flex-col items-center gap-2 pt-1">
            <div
              title={`${panitiaName} (${panitiaRole})`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 cursor-default"
            >
              {panitiaName.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-1 pt-1">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                {panitiaName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {panitiaName}
                </p>
                <p className="text-xs capitalize text-gray-500">
                  {panitiaRole}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
