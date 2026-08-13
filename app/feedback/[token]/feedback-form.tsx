"use client";

import { useState, useEffect } from "react";

interface FeedbackFormProps {
  day: number;
  token: string;
}

interface StudentResult {
  id: string;
  nama: string;
  prodi_nama: string;
}

const KATEGORI_OPTIONS = [
  "Materi",
  "Pembicara",
  "Panitia",
  "Acara",
  "Suasana",
] as const;

type Kategori = (typeof KATEGORI_OPTIONS)[number];

export default function FeedbackForm({ day, token }: FeedbackFormProps) {
  // State pencarian nama
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentResult[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(
    null,
  );
  const [searching, setSearching] = useState(false);

  // State form
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [kategori, setKategori] = useState<Kategori | "">("");
  const [komentar, setKomentar] = useState("");

  // State submit
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Debounced search
  useEffect(() => {
    if (selectedStudent) return;
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/students/search?q=${encodeURIComponent(query)}&day=${day}&for=feedback`,
        );
        const data = await res.json();
        setResults(data.students || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, selectedStudent, day]);

  function handleSelectStudent(student: StudentResult) {
    setSelectedStudent(student);
    setQuery(student.nama);
    setResults([]);
  }

  function handleChangeStudent() {
    setSelectedStudent(null);
    setQuery("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedStudent) {
      setErrorMsg("Pilih nama kamu dari daftar dulu.");
      return;
    }
    if (!rating || rating < 1 || rating > 5) {
      setErrorMsg("Pilih rating 1-5 bintang.");
      return;
    }
    if (!kategori) {
      setErrorMsg("Pilih kategori feedback.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          student_id: selectedStudent.id,
          rating,
          kategori,
          komentar: komentar.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Gagal submit feedback.");
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
            Feedback Terkirim!
          </h1>
          <p className="mt-2 text-gray-700">
            Terima kasih, {selectedStudent?.nama}!
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
            Feedback PKKMB
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Berikan rating & masukan untuk hari ini.
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

          {/* Rating bintang */}
          <div>
            <label className="mb-1 block text-sm font-medium">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-3xl transition transform hover:scale-110"
                    aria-label={`Rating ${star} bintang`}
                  >
                    <span className={active ? "text-ember" : "text-gray-300"}>
                      ★
                    </span>
                  </button>
                );
              })}
            </div>
            {rating > 0 && (
              <p className="mt-1 text-xs text-gray-500">{rating}/5</p>
            )}
          </div>

          {/* Kategori */}
          <div>
            <label className="mb-1 block text-sm font-medium">Kategori</label>
            <div className="flex flex-wrap gap-2">
              {KATEGORI_OPTIONS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKategori(k)}
                  className={`rounded-full border-2 px-3 py-1 text-sm font-medium transition ${
                    kategori === k
                      ? "border-twilight bg-twilight text-white"
                      : "border-gray-300 text-gray-700 hover:border-twilight/50"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Komentar */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Komentar <span className="text-gray-400">(opsional)</span>
            </label>
            <textarea
              value={komentar}
              onChange={(e) => setKomentar(e.target.value)}
              placeholder="Tulis masukan atau saran kamu..."
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-twilight focus:ring-2 focus:ring-twilight/20"
            />
            <p className="mt-1 text-right text-xs text-gray-400">
              {komentar.length}/500
            </p>
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
            {submitting ? "Mengirim..." : "Submit Feedback"}
          </button>
        </form>
      </div>
    </div>
  );
}
