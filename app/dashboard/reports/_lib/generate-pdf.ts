// jsPDF di-import dinamis di dalam fungsi (±300 KB) supaya gak ikut
// bundle awal halaman reports — baru diunduh saat user klik Export PDF.
interface RosterStudent {
  id: string;
  nama: string;
  days: number[];
}

interface ReportData {
  day: number;
  prodiNama: string;
  rosterStudents: RosterStudent[];
}

const HEADER_FILL: [number, number, number] = [243, 228, 231];
const MARK_FILL: [number, number, number] = [226, 226, 226];
const GRAY_TEXT: [number, number, number] = [90, 90, 90];

export async function generateReportPDF(data: ReportData) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // ── Judul
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("REKAP ABSENSI PKKMB SPARK", pageWidth / 2, 20, {
    align: "center",
  });

  // ── Detail: kiri jurusan, kanan hari & kampus
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.text(`Jurusan : ${data.prodiNama}`, 14, 30);
  doc.text(`Hari : ${data.day}`, 120, 30);
  doc.text("Kampus : Cakrawala University", 120, 36);

  // Legenda tanda hadir
  doc.setFont("times", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY_TEXT);
  doc.text("Sel yang di ceklis = hadir pada hari tersebut.", 14, 42);

  if (data.rosterStudents.length === 0) {
    doc.setFont("times", "italic");
    doc.setFontSize(10);
    doc.setTextColor(...GRAY_TEXT);
    doc.text("Tidak ada mahasiswa pada filter ini.", 14, 50);
  } else {
    autoTable(doc, {
      startY: 46,
      head: [
        [
          {
            content: "NO",
            rowSpan: 2,
            styles: { halign: "center", fontStyle: "bold" },
          },
          {
            content: "NAMA MAHASISWA",
            rowSpan: 2,
            styles: { fontStyle: "bold" },
          },
          {
            content: "Hari Ke-",
            colSpan: 6,
            styles: { halign: "center", fontStyle: "bold" },
          },
          {
            content: "KETERANGAN",
            rowSpan: 2,
            styles: { halign: "center", fontStyle: "bold" },
          },
        ],
        ["1", "2", "3", "4", "5", "6"],
      ],
      body: data.rosterStudents.map((m, i) => [
        i + 1,
        m.nama,
        // "3" di font zapfdingbats = tanda centang
        ...[1, 2, 3, 4, 5, 6].map((d) => (m.days.includes(d) ? "3" : "")),
        "",
      ]),
      theme: "grid",
      headStyles: { fillColor: HEADER_FILL, textColor: [0, 0, 0] },
      styles: {
        font: "times",
        fontSize: 10,
        cellPadding: 1.5,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        2: { cellWidth: 9, halign: "center" },
        3: { cellWidth: 9, halign: "center" },
        4: { cellWidth: 9, halign: "center" },
        5: { cellWidth: 9, halign: "center" },
        6: { cellWidth: 9, halign: "center" },
        7: { cellWidth: 9, halign: "center" },
        8: { cellWidth: 32 },
      },
      didParseCell: (d) => {
        if (d.section !== "body") return;
        if (
          d.column.index >= 2 &&
          d.column.index <= 7 &&
          String(d.cell.raw) === "3"
        ) {
          d.cell.text = ["3"];
          d.cell.styles.font = "zapfdingbats";
          d.cell.styles.fillColor = MARK_FILL;
        }
      },
      margin: { left: 14, right: 14 },
    });
  }

  const slug =
    data.prodiNama
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "prodi";
  doc.save(`rekap-absensi-${slug}-hari-${data.day}.pdf`);
}
