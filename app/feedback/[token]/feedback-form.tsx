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

const LIKERT_QUESTIONS = [
  {
    id: "q1_materi",
    text: "Materi yang disampaikan selama PKKMB relevan dan bermanfaat bagi saya sebagai mahasiswa baru.",
  },
  {
    id: "q2_narasumber",
    text: "Narasumber menyampaikan materi dengan jelas, menarik, dan mudah dipahami.",
  },
  {
    id: "q3_panitia",
    text: "Panitia memberikan pelayanan serta informasi yang jelas selama pelaksanaan PKKMB.",
  },
  {
    id: "q4_jadwal",
    text: "Jadwal dan alur kegiatan PKKMB berjalan dengan tertib dan sesuai waktu yang telah ditentukan.",
  },
  {
    id: "q5_fasilitas",
    text: "Fasilitas dan sarana yang disediakan selama PKKMB sudah memadai.",
  },
  {
    id: "q6_puas",
    text: "Secara keseluruhan, saya puas dengan pelaksanaan PKKMB tahun ini.",
  },
] as const;

const LIKERT_OPTIONS = [
  { value: 1, short: "STS", full: "Sangat Tidak Setuju" },
  { value: 2, short: "TS", full: "Tidak Setuju" },
  { value: 3, short: "N", full: "Netral" },
  { value: 4, short: "S", full: "Setuju" },
  { value: 5, short: "SS", full: "Sangat Setuju" },
] as const;

type RatingKey = (typeof LIKERT_QUESTIONS)[number]["id"];

const INITIAL_RATINGS: Record<RatingKey, number> = {
  q1_materi: 0,
  q2_narasumber: 0,
  q3_panitia: 0,
  q4_jadwal: 0,
  q5_fasilitas: 0,
  q6_puas: 0,
};

export default function FeedbackForm({ day, token }: FeedbackFormProps) {
  // State pencarian nama
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentResult[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(
    null,
  );
  const [searching, setSearching] = useState(false);

  // State form
  const [ratings, setRatings] =
    useState<Record<RatingKey, number>>(INITIAL_RATINGS);
  const [kelebihan, setKelebihan] = useState("");
  const [saran, setSaran] = useState("");

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

    const unanswered = LIKERT_QUESTIONS.filter((q) => !ratings[q.id]);
    if (unanswered.length > 0) {
      setErrorMsg(
        `Masih ada ${unanswered.length} pertanyaan yang belum dijawab.`,
      );
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
          ...ratings,
          kelebihan: kelebihan.trim() || undefined,
          saran: saran.trim() || undefined,
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
          <h1 className="text-2xl font-bold text-white">Feedback Terkirim!</h1>
          <p className="mt-2 text-gray-400">
            Terima kasih, {selectedStudent?.nama}!
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
            Feedback PKKMB SPARK
          </h1>
          <p className="mt-1 text-sm text-ember/70">
            Berikan penilaian & masukan untuk PKKMB Spark.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="w-full rounded-lg border border-gray-700 bg-[#1d1c1c] px-3 py-2 text-white placeholder-gray-500 outline-none transition"
                  autoComplete="off"
                />
                {searching && (
                  <p className="mt-1 text-xs text-ember">Mencari...</p>
                )}
                {results.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-700 bg-[#1d1c1c] shadow-xl">
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

          {/* Legenda skala Likert */}
          <div className="rounded-lg border border-inferno/20 bg-inferno/5 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-twilight">
              Skala Penilaian
            </p>
            <div className="mt-2 grid grid-cols-5 gap-1 text-center">
              {LIKERT_OPTIONS.map((o) => (
                <div key={o.value}>
                  <div className="text-sm font-bold text-twilight">
                    {o.value}
                  </div>
                  <div className="text-[10px] text-twilight">{o.full}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pertanyaan Likert */}
          <div className="space-y-4">
            {LIKERT_QUESTIONS.map((q, idx) => (
              <div key={q.id}>
                <p className="mb-2 text-sm font-medium text-white">
                  <span className="font-bold text-white">{idx + 1}.</span>{" "}
                  {q.text}
                </p>
                <div className="grid grid-cols-5 gap-1">
                  {LIKERT_OPTIONS.map((opt) => {
                    const active = ratings[q.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setRatings((prev) => ({ ...prev, [q.id]: opt.value }))
                        }
                        title={opt.full}
                        aria-pressed={active}
                        className={`flex items-center justify-center rounded-md border-2 py-2 transition ${
                          active
                            ? "border-inferno bg-inferno/30 text-white"
                            : "border-gray-700 text-gray-300 hover:border-twilight hover:bg-twilight/30"
                        }`}
                      >
                        <span className="text-sm font-bold">{opt.value}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Pertanyaan terbuka */}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-white">
                Kelebihan / hal yang paling berkesan
              </label>
              <textarea
                value={kelebihan}
                onChange={(e) => setKelebihan(e.target.value)}
                placeholder="Menurut Anda, apa kelebihan atau hal yang paling berkesan dari pelaksanaan PKKMB tahun ini?"
                rows={3}
                maxLength={500}
                className="w-full rounded-lg border border-gray-700 bg-[#1d1c1c] px-3 py-2 text-white placeholder-gray-500 outline-none transition focus:border-inferno focus:ring-2 focus:ring-inferno/20"
              />
              <p className="mt-1 text-right text-xs text-gray-500">
                {kelebihan.length}/500
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-white">
                Saran / masukan
              </label>
              <textarea
                value={saran}
                onChange={(e) => setSaran(e.target.value)}
                placeholder="Apa saran atau masukan yang ingin Anda berikan agar pelaksanaan PKKMB berikutnya menjadi lebih baik?"
                rows={3}
                maxLength={500}
                className="w-full rounded-lg border border-gray-700 bg-[#1d1c1c] px-3 py-2 text-white placeholder-gray-500 outline-none transition focus:border-inferno focus:ring-2 focus:ring-inferno/20"
              />
              <p className="mt-1 text-right text-xs text-gray-500">
                {saran.length}/500
              </p>
            </div>
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
            {submitting ? "Mengirim..." : "Submit Feedback"}
          </button>
        </form>
      </div>
    </div>
  );
}
