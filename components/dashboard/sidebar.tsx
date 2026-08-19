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
  X,
} from "lucide-react";
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
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  panitiaName,
  panitiaRole,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Logout diproses server-side di /auth/signout supaya semua
  // cookie sb-* pasti terhapus (signOut() browser tidak selalu cukup)
  const handleLogout = () => {
    window.location.href = "/auth/signout";
  };

  const inner = (isMobile: boolean) => (
    <aside
      className={`flex h-full flex-col border-r border-gray-800 bg-black transition-all duration-300 ${
        isMobile ? "w-64" : collapsed ? "w-16" : "w-48"
      }`}
    >
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-800 px-3 gap-2">
        <div className="flex shrink-0 items-center justify-center">
          {(isMobile || !collapsed) ? (
            <Image
              src="/cak-u-logo.png"
              alt="Logo PKKMB"
              width={110}
              height={60}
              className="rounded-lg object-cover"
            />
          ) : (
            <Image
              src="/logo.png"
              alt="Logo Cakrawala"
              width={32}
              height={32}
              className="object-contain"
            />
          )}
        </div>
        {isMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Tutup menu"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
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
              onClick={isMobile ? onCloseMobile : undefined}
              aria-current={isActive ? "page" : undefined}
              title={!isMobile && collapsed ? label : undefined}
              className={`flex items-center rounded-lg py-2 text-sm font-medium transition-colors ${
                !isMobile && collapsed ? "justify-center px-2" : "gap-3 px-3"
              } ${
                isActive
                  ? "bg-ember/20 text-ember"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!isMobile && collapsed ? null : <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-gray-800 p-3 space-y-1">
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex h-8 w-full items-center rounded-lg text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors ${
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
        )}

        {(!isMobile && collapsed) ? (
          <div className="flex flex-col items-center gap-2 pt-1">
            <div
              title={`${panitiaName} (${panitiaRole})`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-ember/20 text-sm font-semibold text-ember cursor-default"
            >
              {panitiaName.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-inferno/20 hover:text-inferno transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-1 pt-1">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ember/20 text-sm font-semibold text-ember">
                {panitiaName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {panitiaName}
                </p>
                <p className="text-xs capitalize text-gray-400">
                  {panitiaRole}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-inferno/20 hover:text-inferno transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex">{inner(false)}</div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 h-full">{inner(true)}</div>
        </div>
      )}
    </>
  );
}
