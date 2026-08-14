"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { DayPicker } from "@/components/dashboard/day-picker";
import {
  Users,
  CheckCircle2,
  XCircle,
  MessageSquare,
  QrCode,
  ArrowRight,
  TrendingDown,
  Clock,
} from "lucide-react";

interface Stats {
  totalMahasiswa: number;
  totalHadir: number;
  totalBelum: number;
  persentaseHadir: number;
  totalFeedback: number;
}

interface ProdiItem {
  id: string;
  nama: string;
  total: number;
  hadir: number;
  persen: number;
}

interface Activity {
  id: string;
  type: "absensi" | "feedback" | "qr";
  title: string;
  subtitle: string;
  waktu: string;
}

interface Props {
  currentDay: number;
  activeSession: { type: string | null; day: number } | null;
  stats: Stats;
  prodiTerendah: ProdiItem[];
  activities: Activity[];
}

function formatWaktu(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function persenColor(persen: number): string {
  if (persen < 50) return "text-inferno";
  if (persen < 75) return "text-amber-400";
  return "text-emerald-400";
}

function persenBar(persen: number): string {
  if (persen < 50) return "bg-inferno";
  if (persen < 75) return "bg-amber-500";
  return "bg-emerald-500";
}

export function DashboardView({
  currentDay,
  activeSession,
  stats,
  prodiTerendah,
  activities,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function selectDay(d: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("day", String(d));
    router.push(`${pathname}?${params.toString()}`);
  }

  // Realtime refresh saat ada perubahan attendance/feedback/session
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("dashboard-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "attendance" },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feedback" },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "qr_session" },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const statCards = [
    {
      label: "Total Mahasiswa",
      value: stats.totalMahasiswa,
      icon: Users,
      valueColor: "text-white",
    },
    {
      label: "Hadir Hari Ini",
      value: stats.totalHadir,
      icon: CheckCircle2,
      valueColor: "text-emerald-400",
    },
    {
      label: "Belum Hadir",
      value: stats.totalBelum,
      icon: XCircle,
      valueColor: "text-inferno",
    },
    {
      label: "Feedback Hari Ini",
      value: stats.totalFeedback,
      icon: MessageSquare,
      valueColor: "text-amber-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      </div>

      {/* Filter hari */}
      <DayPicker value={currentDay} onChange={selectDay} />

      {/* Quick action: QR */}
      <Link
        href="/dashboard/qr"
        className="flex items-center justify-between rounded-lg border border-gray-800 bg-gradient-to-r from-twilight to-[#5a0f1f] p-5 transition hover:border-ember"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10">
            <QrCode className="h-6 w-6 text-ember" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {activeSession
                ? "Lihat Sesi QR Aktif"
                : "Buat Sesi QR Absensi/Feedback"}
            </p>
            <p className="mt-0.5 text-xs text-gray-300">
              {activeSession
                ? "Sesi sedang berjalan — klik untuk lihat QR code"
                : "Mulai sesi baru untuk hari ini"}
            </p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-ember" />
      </Link>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, valueColor }) => (
          <div
            key={label}
            className="rounded-lg border border-gray-800 bg-[#1d1c1c] p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400">{label}</p>
                <p className={`mt-1 text-2xl font-bold ${valueColor}`}>
                  {value}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ember">
                <Icon className="h-4 w-4 text-inferno" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two columns: Prodi terendah + Aktivitas terbaru */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Prodi perlu di-dorong */}
        <div className="rounded-lg border border-gray-800 bg-[#1d1c1c] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300">
              PRODI YANG PERLU ABSEN
              
            </h2>
            <TrendingDown className="h-4 w-4 text-inferno" />
          </div>
          {prodiTerendah.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">
              Belum ada data prodi.
            </p>
          ) : (
            <div className="space-y-3">
              {prodiTerendah.map((p, idx) => (
                <div key={p.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="w-4 text-gray-500">{idx + 1}.</span>
                      <span className="truncate font-medium text-white">
                        {p.nama}
                      </span>
                    </div>
                    <span className={`font-bold ${persenColor(p.persen)}`}>
                      {p.persen}%
                    </span>
                  </div>
                  <div className="ml-6 flex items-center gap-2 text-xs text-gray-500">
                    <span className="whitespace-nowrap">
                      {p.hadir}/{p.total}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-800">
                      <div
                        className={persenBar(p.persen)}
                        style={{ width: `${p.persen}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/dashboard/attendance"
            className="mt-4 inline-flex items-center gap-1 text-xs text-ember hover:text-inferno"
          >
            Lihat semua <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Aktivitas terbaru */}
        <div className="rounded-lg border border-gray-800 bg-[#1d1c1c] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300">
              AKTIVITAS TERBARU
            </h2>
            <Clock className="h-4 w-4 text-gray-500" />
          </div>
          {activities.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">
              Belum ada aktivitas hari ini.
            </p>
          ) : (
            <ul className="divide-y divide-gray-800">
              {activities.map((a) => (
                <li
                  key={`${a.type}-${a.id}`}
                  className="flex items-center justify-between py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                        a.type === "absensi"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : a.type === "feedback"
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-twilight/25 text-ember"
                      }`}
                    >
                      {a.type === "absensi" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : a.type === "feedback" ? (
                        <MessageSquare className="h-4 w-4" />
                      ) : (
                        <QrCode className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {a.title}
                      </p>
                      {a.subtitle && (
                        <p className="truncate text-xs text-gray-500">
                          {a.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="ml-2 whitespace-nowrap text-xs text-gray-500">
                    {formatWaktu(a.waktu)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
