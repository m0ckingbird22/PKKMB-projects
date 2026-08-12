"use client";

import { useState, useEffect, useRef } from "react";

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-ember/20 to-white px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-twilight">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-ember"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-twilight">
            Absensi Berhasil!
          </h1>
          <p className="mt-2 text-gray-700">
            {selectedStudent?.nama} — Hari ke {day} PKKMB
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ember/20 to-white px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6">
          <span className="inline-block rounded-full bg-ember px-3 py-1 text-xs font-bold uppercase tracking-wide text-twilight">
            Hari {day}
          </span>
          <h1 className="mt-3 text-2xl font-bold text-twilight">
            Absensi PKKMB
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Isi form berikut untuk mencatat kehadiran.
          </p>
        </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Search nama */}
        <div>
          <label className="mb-1 block text-sm font-medium">Nama Kamu</label>
          {selectedStudent ? (
            <div className="flex items-center justify-between rounded-lg border-2 border-twilight bg-ember/20 px-3 py-2">
              <div>
                <p className="font-semibold text-twilight">{selectedStudent.nama}</p>
                <p className="text-sm text-gray-700">
                  {selectedStudent.prodi_nama}
                </p>
              </div>
              <button
                type="button"
                onClick={handleChangeStudent}
                className="rounded px-2 py-1 text-sm font-medium text-twilight transition hover:bg-twilight hover:text-white"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-twilight focus:ring-2 focus:ring-twilight/20"
                autoComplete="off"
              />
              {searching && (
                <p className="mt-1 text-xs text-gray-400">Mencari...</p>
              )}
              {results.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                  {results.map((s) => (
                    <li
                      key={s.id}
                      onClick={() => handleSelectStudent(s)}
                      className="cursor-pointer px-3 py-2 transition hover:bg-ember/30"
                    >
                      <p className="font-medium">{s.nama}</p>
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
          <label className="mb-1 block text-sm font-medium">
            Mode Kehadiran
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMode("offline")}
              className={`flex-1 rounded-lg border-2 px-4 py-2 font-medium transition ${
                mode === "offline"
                  ? "border-twilight bg-twilight text-white"
                  : "border-gray-300 text-gray-700 hover:border-twilight/50"
              }`}
            >
              Offline
            </button>
            <button
              type="button"
              onClick={() => setMode("online")}
              className={`flex-1 rounded-lg border-2 px-4 py-2 font-medium transition ${
                mode === "online"
                  ? "border-twilight bg-twilight text-white"
                  : "border-gray-300 text-gray-700 hover:border-twilight/50"
              }`}
            >
              Online
            </button>
          </div>
        </div>

        {/* Upload foto */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            {mode === "online" ? "Screenshot Zoom" : "Foto di Depan Background"}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="w-full text-sm"
          />
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Preview"
              className="mt-2 h-40 w-full rounded object-cover"
            />
          )}
        </div>

        {errorMsg && (
          <p className="rounded-lg bg-inferno/10 px-3 py-2 text-sm font-medium text-inferno">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-twilight py-3 font-semibold text-white transition hover:bg-inferno disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Mengirim..." : "Submit Absensi"}
        </button>
      </form>
      </div>
    </div>
  );
}
