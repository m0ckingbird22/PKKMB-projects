/* eslint-disable @typescript-eslint/no-require-imports */
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

// Resolve path absolut (biar jalan dari mana saja cwd-nya)
const xlsxPath = path.resolve(
  __dirname,
  "..",
  "data-dummy",
  "data dummy mahasiswa.xlsx",
);
const outPath = path.resolve(__dirname, "..", "lib", "mock-data.ts");

// Baca Excel
const wb = xlsx.readFile(xlsxPath);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
// Skip baris header (index 0), buang baris kosong
const data = rows.slice(1).filter((r) => r.length > 0);

// Transformasi tiap baris jadi AttendanceRecord + field mock
const records = data.map((r, i) => {
  const nim = String(r[2]);
  const nama = String(r[1]);
  const prodi = String(r[3]);
  const fakultas = String(r[4]);

  // Mock deterministik (pakai index, BUKAN Math.random)
  // → data sama setiap regenerate, ga berubah2
  const mode = i % 10 < 7 ? "offline" : "online"; // 70% offline
  const status = i % 20 === 0 ? "flagged" : "hadir"; // ~5% flagged

  // Waktu absen spread 07:30 - 09:30 (basis index)
  const totalMinutes = 7 * 60 + 30 + ((i * 7) % 120);
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const mm = String(totalMinutes % 60).padStart(2, "0");
  const waktuAbsen = `${hh}:${mm}`;

  return { nim, nama, prodi, fakultas, mode, waktuAbsen, status };
});

// Group by prodi → itung jumlah mahasiswa per prodi
const prodiMap = new Map();
for (const r of records) {
  if (!prodiMap.has(r.prodi)) {
    prodiMap.set(r.prodi, { nama: r.prodi, fakultas: r.fakultas, jumlah: 0 });
  }
  prodiMap.get(r.prodi).jumlah++;
}
const prodiList = Array.from(prodiMap.values()).sort((a, b) =>
  a.nama.localeCompare(b.nama),
);

// Tulis file TypeScript
const output = `// AUTO-GENERATED from data-dummy/data dummy mahasiswa.xlsx
  // Regenerate via: node scripts/gen-mock-data.cjs
  import type { AttendanceRecord, ProdiStat } from "./types";

  export const MOCK_ATTENDANCE: AttendanceRecord[] = ${JSON.stringify(records, null, 2)};

  export const MOCK_PRODI_LIST: ProdiStat[] = ${JSON.stringify(prodiList, null, 2)};
  `;

fs.writeFileSync(outPath, output);

// Logring buat verifikasi
const offline = records.filter((r) => r.mode === "offline").length;
const online = records.filter((r) => r.mode === "online").length;
const flagged = records.filter((r) => r.status === "flagged").length;

console.log("✓ Generated lib/mock-data.ts");
console.log("  Records:", records.length);
console.log("  Prodi:", prodiList.length);
console.log("  Offline:", offline, "| Online:", online, "| Flagged:", flagged);
