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
          `/api/students/search?q=${encodeURIComponent(query)}`,
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
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-green-600">
            Absensi Berhasil !
          </h1>
          <p className="mt-2 text-gray-600">
            {selectedStudent?.nama} — Hari ke {day} PKKMB
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-1 text-lg font-semibold">Absensi PKKMB — Hari {day}</h1>
      <p className="mb-6 text-sm text-gray-500">
        Isi form berikut untuk mencatat kehadiran.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Search nama */}
        <div>
          <label className="mb-1 block text-sm font-medium">Nama Kamu</label>
          {selectedStudent ? (
            <div className="flex items-center justify-between rounded border border-gray-300 px-3 py-2">
              <div>
                <p className="font-medium">{selectedStudent.nama}</p>
                <p className="text-sm text-gray-500">
                  {selectedStudent.prodi_nama}
                </p>
              </div>
              <button
                type="button"
                onClick={handleChangeStudent}
                className="text-sm text-blue-600 underline"
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
                className="w-full rounded border border-gray-300 px-3 py-2"
                autoComplete="off"
              />
              {searching && (
                <p className="mt-1 text-xs text-gray-400">Mencari...</p>
              )}
              {results.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded border border-gray-200 bg-white shadow-lg">
                  {results.map((s) => (
                    <li
                      key={s.id}
                      onClick={() => handleSelectStudent(s)}
                      className="cursor-pointer px-3 py-2 hover:bg-gray-100"
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
              className={`flex-1 rounded border px-4 py-2 ${
                mode === "offline"
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : "border-gray-300"
              }`}
            >
              Offline
            </button>
            <button
              type="button"
              onClick={() => setMode("online")}
              className={`flex-1 rounded border px-4 py-2 ${
                mode === "online"
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : "border-gray-300"
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

        {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-blue-600 py-3 font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Mengirim..." : "Submit Absensi"}
        </button>
      </form>
    </div>
  );
}
