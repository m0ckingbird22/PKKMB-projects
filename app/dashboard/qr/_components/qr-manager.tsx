"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "react-hot-toast";
import {
  Plus,
  StopCircle,
  Loader2,
  Trash2,
  Copy,
  Check,
  Printer,
} from "lucide-react";
import { DayPicker } from "@/components/dashboard/day-picker";

type Session = {
  id: string;
  token: string;
  day: number;
  is_active: boolean | null;
  type: string | null;
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
  const [type, setType] = useState<"absensi" | "feedback">("absensi");
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
        body: JSON.stringify({ day, type }),
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

  const sessionUrl = (s: Session) =>
    `${origin}/${s.type === "feedback" ? "feedback" : "absensi"}/${s.token}`;

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

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = async (s: Session) => {
    try {
      await navigator.clipboard.writeText(sessionUrl(s));
      setCopiedId(s.id);
      toast.success("Link disalin");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error("Gagal menyalin link", e);
      toast.error("Gagal menyalin link");
    }
  };

  const printSession = (s: Session, e: MouseEvent<HTMLButtonElement>) => {
    const card = e.currentTarget.closest("[data-qr-card]");
    const svg = card?.querySelector("svg");
    if (!svg) {
      toast.error("QR tidak ditemukan");
      return;
    }

    const printWindow = window.open("", "_blank", "width=420,height=560");
    if (!printWindow) {
      toast.error("Popup diblokir browser, izinkan popup untuk print");
      return;
    }

    printWindow.document.write(`
  <html>
    <head>
      <title>${s.token}</title>
      <style>
        * { box-sizing: border-box; }
        body {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          font-family: system-ui, sans-serif;
          gap: 16px;
        }
        .logo-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
        }
        .logo-row img {
          height: 120px;
          width: auto;
          display: block;
        }
        svg { width: 280px; height: 280px; }
        .badge {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #92400e;
          background: #fef3c7;
          padding: 4px 10px;
          border-radius: 999px;
        }
        h1 { font-size: 20px; margin: 0; font-family: monospace; }
        p { color: #555; margin: 0; font-size: 13px; }
        @media print {
          @page { margin: 1cm; }
        }
      </style>
    </head>
    <body>
      <div class="logo-row">
        <img src="${origin}/logo-spark-hitam.png" alt="Logo Spark" />
        <img src="${origin}/logo.png" alt="Logo Cakrawala" />
      </div>
      <span class="badge">${s.type === "feedback" ? "Feedback" : "Absensi"}</span>
      ${svg.outerHTML}
      <h1>${s.token}</h1>
      <p style="font-weight: bold;">Day ${s.day}</p>
    </body>
  </html>
`);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Tombol buat sesi */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-twilight px-4 py-2 text-sm font-medium text-white hover:bg-ember"
      >
        <Plus className="h-4 w-4" /> Buat Sesi Baru
      </button>

      {/* Modal form */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#1d1c1c] border border-gray-800 rounded-lg p-6 w-[90vw] max-w-sm space-y-4">
            <h2 className="text-lg font-semibold text-white">Buat Sesi QR</h2>
            <div>
              <span className="block text-sm text-gray-300 mb-1">
                Tipe Sesi
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType("absensi")}
                  className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${
                    type === "absensi"
                      ? "border-twilight bg-twilight text-white"
                      : "border-gray-700 text-gray-300 hover:border-twilight/50"
                  }`}
                >
                  Absensi
                </button>
                <button
                  type="button"
                  onClick={() => setType("feedback")}
                  className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${
                    type === "feedback"
                      ? "border-twilight bg-twilight text-white"
                      : "border-gray-700 text-gray-300 hover:border-twilight/50"
                  }`}
                >
                  Feedback
                </button>
              </div>
            </div>
            <DayPicker value={day} onChange={setDay} label="Hari PKKMB" />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-sm text-gray-400 hover:text-white"
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
          <h2 className="text-sm font-semibold text-gray-300 mb-3">
            SESI AKTIF
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((s) => (
              <div
                key={s.id}
                data-qr-card
                className="bg-[#1d1c1c] rounded-lg border border-gray-800 p-6 space-y-4"
              >
                <div className="flex justify-center bg-white p-4 rounded-lg">
                  <QRCodeSVG value={sessionUrl(s)} size={220} />
                </div>
                <div className="text-center space-y-1">
                  <div className="flex justify-center gap-2">
                    <span className="inline-block rounded-full bg-ember/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ember">
                      {s.type === "feedback" ? "Feedback" : "Absensi"}
                    </span>
                  </div>
                  <p className="font-mono text-lg font-bold text-white">
                    {s.token}
                  </p>
                  <p className="text-xs text-gray-400">
                    Day {s.day} •{" "}
                    {new Date(s.created_at ?? "").toLocaleString("id-ID", {
                      timeZone: "Asia/Jakarta",
                    })}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => copyLink(s)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:border-twilight hover:text-white"
                  >
                    {copiedId === s.id ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedId === s.id ? "Tersalin" : "Salin Link"}
                  </button>
                  <button
                    onClick={(e) => printSession(s, e)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:border-twilight hover:text-white"
                  >
                    <Printer className="h-4 w-4" /> Cetak PDF
                  </button>
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
            <h2 className="text-sm font-semibold text-gray-300">RIWAYAT</h2>
            <button
              onClick={clearHistory}
              disabled={clearing}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:border-inferno hover:text-inferno disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {clearing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              Hapus Riwayat
            </button>
          </div>
          <div className="bg-[#1d1c1c] rounded-lg border border-gray-800 divide-y divide-gray-800">
            {history.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-medium text-white">
                      {s.token}
                    </p>
                    <span className="rounded-full bg-ember/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ember">
                      {s.type === "feedback" ? "Feedback" : "Absensi"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">Day {s.day}</p>
                </div>
                <span className="text-xs text-gray-500">Selesai</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {initial.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Klik {"'Buat Sesi Baru'"} untuk memulai.
        </div>
      )}
    </div>
  );
}
