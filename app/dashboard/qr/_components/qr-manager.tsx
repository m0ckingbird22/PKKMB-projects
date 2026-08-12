"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "react-hot-toast";
import { Plus, StopCircle, Loader2, Trash2 } from "lucide-react";

type Session = {
  id: string;
  token: string;
  day: number;
  is_active: boolean | null;
  created_at: string | null;
};

interface Props {
  sessions: Session[];
  origin: string;
}

export function QrManager({ sessions: initial, origin }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [day, setDay] = useState(1);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  const active = initial.filter((s) => s.is_active);
  const history = initial.filter((s) => !s.is_active);

  const createSession = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Sesi berhasil dibuat");
      setIsOpen(false);
      router.refresh();
    } catch (e) {
      console.error("Gagal membuat sesi", e);
      toast.error("Gagal membuat sesi");
    } finally {
      setLoading(false);
    }
  };

  const endSession = async (id: string) => {
    const res = await fetch(`/api/qr/${id}`, { method: "PATCH" });
    if (res.ok) {
      toast.success("Sesi diakhiri");
      router.refresh();
    } else {
      toast.error("Gagal mengakhiri sesi");
    }
  };

  const clearHistory = async () => {
    if (
      !confirm("hapus semua riwayat sesi? tindakan ini tidak bisa di batalkan")
    ) {
      return;
    }
    setClearing(true);
    try {
      const res = await fetch("/api/qr/history", { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Riwayat berhasil dihapus");
      router.refresh();
    } catch (e) {
      console.error("Gagal menghapus riwayat", e);
      toast.error("Gagal menghapus riwayat");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tombol buat sesi */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-twilight px-4 py-2 text-sm font-medium text-white hover:bg-inferno"
      >
        <Plus className="h-4 w-4" /> Buat Sesi Baru
      </button>

      {/* Modal form */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-80 space-y-4">
            <h2 className="text-lg font-semibold">Buat Sesi QR</h2>
            <label className="block text-sm">
              <span className="text-gray-700">Hari PKKMB</span>
              <select
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              >
                {Array.from({ length: 6 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Hari {d}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-sm"
              >
                Batal
              </button>
              <button
                onClick={createSession}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-twilight px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />} Buat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sesi aktif */}
      {active.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            SESI AKTIF
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-xl border p-6 space-y-4"
              >
                <div className="flex justify-center bg-white p-4 rounded-lg">
                  <QRCodeSVG
                    value={`${origin}/absensi/${s.token}`}
                    size={220}
                  />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-mono text-lg font-bold text-twilight">
                    {s.token}
                  </p>
                  <p className="text-xs text-gray-500">
                    Day {s.day} •{" "}
                    {new Date(s.created_at ?? "").toLocaleString("id-ID")}
                  </p>
                </div>
                <button
                  onClick={() => endSession(s.id)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-inferno px-3 py-2 text-sm text-inferno hover:bg-inferno hover:text-white"
                >
                  <StopCircle className="h-4 w-4" /> Akhiri Sesi
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Riwayat */}
      {history.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">RIWAYAT</h2>
            <button
              onClick={clearHistory}
              disabled={clearing}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:border-inferno hover:text-inferno disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {clearing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              Hapus Riwayat
            </button>
          </div>
          <div className="bg-white rounded-xl border divide-y">
            {history.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="font-mono text-sm font-medium">{s.token}</p>
                  <p className="text-xs text-gray-500">
                    Day
                    {s.day}
                  </p>
                </div>
                <span className="text-xs text-gray-400">Selesai</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {initial.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Belum ada sesi. Klik {"'Buat Sesi Baru'"} untuk memulai.
        </div>
      )}
    </div>
  );
}
