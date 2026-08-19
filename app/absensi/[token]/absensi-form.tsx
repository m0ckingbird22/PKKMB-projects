"use client";

import { useState, useEffect, useRef } from "react";
import { Camera, Image as ImageIcon, X } from "lucide-react";

interface AbsensiFormProps {
  day: number;
  token: string;
}

interface StudentResult {
  id: string;
  nama: string;
  prodi_nama: string;
}

export default function AbsensiForm({ day, token }: AbsensiFormProps) {
  // State pencarian nama
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentResult[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(
    null,
  );
  const [searching, setSearching] = useState(false);

  // State form
  const [mode, setMode] = useState<"offline" | "online" | "">("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // State submit
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // State kamera
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function openCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "user" } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setCameraError(
        "Tidak bisa mengakses kamera. Beri izin kamera di browser, atau gunakan tombol galeri.",
      );
    }
  }

  // Pasang stream ke <video> setelah overlay kamera ter-render
  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOpen]);

  // Matikan kamera kalau komponen unmount
  useEffect(() => stopCamera, []);

  function closeCamera() {
    stopCamera();
    setCameraOpen(false);
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const MAX_DIM = 1080;
    const scale = Math.min(
      1,
      MAX_DIM / Math.max(video.videoWidth, video.videoHeight),
    );

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Kamera depan: preview di-mirror, jadi hasil jepretan ikut di-mirror
    // supaya foto yang tersimpan sama dengan yang dilihat mahasiswa.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `absensi-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        setPhoto(file);
        setPhotoPreview(URL.createObjectURL(file));
        closeCamera();
      },
      "image/jpeg",
      0.7,
    );
  }

  function handleRetakePhoto() {
    setPhoto(null);
    setPhotoPreview(null);
  }

  // Debounced search — biar gak hit API tiap ketikan
  useEffect(() => {
    if (selectedStudent) return; // udah pilih, gak perlu search lagi
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/students/search?q=${encodeURIComponent(query)}&day=${day}`,
        );
        const data = await res.json();
        setResults(data.students || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300); // debounce 300ms

    return () => clearTimeout(timeout);
  }, [query, selectedStudent]);

  function handleSelectStudent(student: StudentResult) {
    setSelectedStudent(student);
    setQuery(student.nama);
    setResults([]);
  }

  function handleChangeStudent() {
    setSelectedStudent(null);
    setQuery("");
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Cek yang sama dengan server: wajib gambar, maks 5 MB
    if (!file.type.startsWith("image/")) {
      setErrorMsg("File harus berupa foto (JPG/PNG/WEBP).");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Foto terlalu besar. Maksimal 5 MB.");
      e.target.value = "";
      return;
    }
    setErrorMsg(null);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedStudent) {
      setErrorMsg("Pilih nama kamu dari daftar dulu.");
      return;
    }
    if (!mode) {
      setErrorMsg("Pilih mode kehadiran.");
      return;
    }
    if (!photo) {
      setErrorMsg("Foto wajib diambil.");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append("token", token);
    formData.append("student_id", selectedStudent.id);
    formData.append("mode", mode);
    formData.append("photo", photo);

    try {
      const res = await fetch("/api/attendance/submit", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Gagal submit absensi.");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan. Coba lagi.");
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black bg-[radial-gradient(circle_at_top_right,#801831_0%,#2E0712_25%,transparent_60%),radial-gradient(circle_at_bottom_left,#801831_0%,#2E0712_25%,transparent_60%)] px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-inferno">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Absensi Berhasil!</h1>
          <p className="mt-2 text-gray-400">
            {selectedStudent?.nama} — Hari ke {day} PKKMB
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black bg-[radial-gradient(circle_at_top_right,#801831_0%,#2E0712_25%,transparent_60%),radial-gradient(circle_at_bottom_left,#801831_0%,#2E0712_25%,transparent_60%)] px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6">
          <span className="inline-block rounded-full bg-twilight px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            Hari {day}
          </span>
          <h1 className="mt-3 text-2xl font-bold text-ember">
            Absensi PKKMB SPARK
          </h1>
          <p className="mt-1 text-sm text-ember/70">
            Isi form berikut untuk mencatat kehadiran.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Search nama */}
          <div>
            <label className="mb-1 block text-sm font-medium text-ember/80">
              Nama Kamu
            </label>
            {selectedStudent ? (
              <div className="flex items-center justify-between rounded-lg border-2 border-inferno bg-inferno/10 px-3 py-2">
                <div>
                  <p className="font-semibold text-white">
                    {selectedStudent.nama}
                  </p>
                  <p className="text-sm text-gray-400">
                    {selectedStudent.prodi_nama}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleChangeStudent}
                  className="rounded px-2 py-1 text-sm font-medium text-inferno transition hover:bg-inferno hover:text-white"
                >
                  Ganti
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ketik nama kamu..."
                  className="w-full rounded-lg border border-gray-700 bg-[#1d1c1c] px-3 py-2 text-white placeholder-gray-500 outline-none transition focus:border-inferno focus:ring-2 focus:ring-inferno/20"
                  autoComplete="off"
                />
                {searching && (
                  <p className="mt-1 text-xs text-ember">Mencari...</p>
                )}
                {results.length > 0 && (
                  <ul className="absolute z-10 mt-1 max-h-[300px] w-full overflow-y-auto rounded-lg border border-gray-700 bg-[#1d1c1c] shadow-xl">
                    {results.map((s) => (
                      <li
                        key={s.id}
                        onClick={() => handleSelectStudent(s)}
                        className="cursor-pointer px-3 py-2 transition hover:bg-inferno/20"
                      >
                        <p className="font-medium text-white">{s.nama}</p>
                        <p className="text-sm text-gray-500">{s.prodi_nama}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Mode kehadiran */}
          <div>
            <label className="mb-1 block text-sm font-medium text-ember/80">
              Mode Kehadiran
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("offline")}
                className={`rounded-md border-2 py-2 text-sm font-bold transition ${
                  mode === "offline"
                    ? "border-inferno bg-inferno/30 text-white"
                    : "border-gray-700 text-gray-300 hover:border-twilight hover:bg-twilight/30"
                }`}
              >
                Offline
              </button>
              <button
                type="button"
                onClick={() => setMode("online")}
                className={`rounded-md border-2 py-2 text-sm font-bold transition ${
                  mode === "online"
                    ? "border-inferno bg-inferno/30 text-white"
                    : "border-gray-700 text-gray-300 hover:border-twilight hover:bg-twilight/30"
                }`}
              >
                Online
              </button>
            </div>
          </div>

          {/* Upload foto */}
          <div>
            <label className="mb-1 block text-sm font-medium text-ember/80">
              {mode === "online" ? "Screenshot Zoom" : "Bukti foto kehadiran"}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            {photoPreview ? (
              <div>
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-40 w-full rounded-lg border border-gray-700 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRetakePhoto}
                  className="mt-2 text-sm font-medium text-white transition hover:text-ember"
                >
                  Ulangi ambil foto
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                {mode !== "online" && (
                  <button
                    type="button"
                    onClick={openCamera}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-inferno py-2.5 text-sm font-semibold text-white transition hover:bg-inferno/80"
                  >
                    <Camera className="h-4 w-4" />
                    Buka Kamera
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-700 py-2.5 text-sm font-medium text-gray-300 transition hover:border-twilight hover:text-white"
                >
                  <ImageIcon className="h-4 w-4" />
                  {mode === "online" ? "Pilih Screenshot" : "Galeri"}
                </button>
              </div>
            )}
            {cameraError && (
              <p className="mt-2 text-xs text-ember">{cameraError}</p>
            )}
          </div>

          {errorMsg && (
            <p className="rounded-lg bg-black/30 px-3 py-2 text-sm font-medium text-ember">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-twilight py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Mengirim..." : "Submit Absensi"}
          </button>
        </form>
      </div>

      {/* Overlay kamera */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={closeCamera}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <X className="h-5 w-5" />
              Tutup
            </button>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Arahkan kamera ke muka
            </p>
          </div>
          <div className="relative flex-1 overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full scale-x-[-1] object-cover"
            />
          </div>
          <div className="flex justify-center py-8">
            <button
              type="button"
              onClick={capturePhoto}
              aria-label="Ambil foto"
              className="rounded-full border-4 border-white bg-inferno transition active:scale-95"
              style={{ height: "4.5rem", width: "4.5rem" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
