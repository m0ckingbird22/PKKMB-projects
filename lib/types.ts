export type AttendanceMode = "offline" | "online";
export type AttendanceStatus = "hadir" | "flagged";

export interface AttendanceRecord {
  nim: string;
  nama: string;
  prodi: string;
  fakultas: string;
  mode: AttendanceMode;
  waktuAbsen: string;
  status: AttendanceStatus;
}

export interface ProdiStat {
  nama: string;
  fakultas: string;
  jumlah: number;
}
