export type AttendanceMode = "offline" | "online";
export type AttendanceStatus = "hadir" | "flagged";

export interface AttendanceRecord {
  id: string;
  nama: string;
  prodi: string;
  mode: AttendanceMode;
  waktuAbsen: string;
  status: AttendanceStatus;
  flagReason: string | null;
  fotoUrl: string;
}

export interface ProdiStat {
  nama: string;
  jumlah: number;
}

export interface FeedbackRecord {
  id: string;
  nama: string;
  prodi: string;
  q1Materi: number;
  q2Narasumber: number;
  q3Panitia: number;
  q4Jadwal: number;
  q5Fasilitas: number;
  q6Puas: number;
  kelebihan: string | null;
  saran: string | null;
  waktu: string;
}
