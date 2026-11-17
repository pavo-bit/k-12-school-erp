import PDFDocument from "pdfkit";

/**
 * Report card data — assembled by the API layer (school, student, enrollment,
 * exam, per-subject marks) and rendered to a self-contained A4 PDF.
 *
 * Designed to print cleanly in black & white as well as on colour printers.
 */
export interface ReportCardLine {
  subject: string;
  code: string | null;
  maxMarks: string;
  passMarks: string;
  theoryMarks: string | null;
  practicalMarks: string | null;
  /** Marks obtained; null → student absent / not assessed ("AB"). */
  obtained: string | null;
  /** "pass" | "fail" | "absent" per line. */
  status: "pass" | "fail" | "absent";
}

export interface ReportCardData {
  schoolName: string;
  academicYear: string;
  examName: string;
  examType: string;
  termName: string | null;
  studentName: string;
  admissionNumber: string;
  className: string;
  sectionName: string;
  rollNumber: string | null;
  dateOfBirth: string | null;
  lines: ReportCardLine[];
  totalMax: string;
  totalObtained: string;
  percentage: string;
  grade: string | null;
  resultStatus: string;
  attendancePresent: number | null;
  attendanceTotal: number | null;
  generatedAt: string;
}

const BRAND = "#0f4c81";
const BRAND_LIGHT = "#e6eff7";
const INK = "#1a2a3a";
const MUTED = "#64748b";
const FAIL = "#dc2626";
const PASS = "#15803d";

function statusColor(status: ReportCardLine["status"]) {
  if (status === "pass") return PASS;
  if (status === "fail") return FAIL;
  return MUTED;
}

export function renderReportCardPdf(data: ReportCardData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 46,
      info: { Title: `Report Card — ${data.studentName}` },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 92;

    // ── Header ───────────────────────────────────────────────────────────
    doc.rect(46, 46, pageWidth, 4).fill(BRAND);
    doc.moveDown(0.6);
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor(BRAND)
      .text(data.schoolName.toUpperCase(), { align: "center" });
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(MUTED)
      .text(
        `Academic Year ${data.academicYear}  ·  ${data.termName ?? "Term"}  ·  ${data.examType} Examination`,
        {
          align: "center",
        },
      );
    doc.moveDown(0.15);
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor(INK)
      .text(data.examName.toUpperCase(), { align: "center" });
    doc.moveDown(0.6);

    // ── Student details box ──────────────────────────────────────────────
    const detailsTop = doc.y;
    const boxHeight = 66;
    doc.roundedRect(46, detailsTop, pageWidth, boxHeight, 6).fill(BRAND_LIGHT);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(INK);

    const col1 = 56;
    const col2 = 46 + pageWidth / 2 + 6;
    const row = (x: number, y: number, label: string, value: string) => {
      doc.font("Helvetica").fontSize(7).fillColor(MUTED).text(label.toUpperCase(), x, y);
      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor(INK)
        .text(value, x, y + 8);
    };
    row(col1, detailsTop + 8, "Name", data.studentName);
    row(col2, detailsTop + 8, "Admission No", data.admissionNumber);
    row(col1, detailsTop + 30, "Class & Section", `${data.className} — ${data.sectionName}`);
    row(
      col2,
      detailsTop + 30,
      "Roll No / DOB",
      `${data.rollNumber ?? "—"}  ·  ${data.dateOfBirth ?? "—"}`,
    );
    doc.y = detailsTop + boxHeight + 14;

    // ── Subjects table ───────────────────────────────────────────────────
    const tableTop = doc.y;
    const cols = [
      { label: "SUBJECT", w: 150, align: "left" as const },
      { label: "MAX", w: 55, align: "center" as const },
      { label: "PASS", w: 55, align: "center" as const },
      { label: "THEORY", w: 55, align: "center" as const },
      { label: "PRACT.", w: 55, align: "center" as const },
      { label: "MARKS", w: 55, align: "center" as const },
      { label: "STATUS", w: 60, align: "center" as const },
    ];
    const colX: number[] = [];
    let x = 46;
    for (const c of cols) {
      colX.push(x);
      x += c.w;
    }
    const rowH = 22;

    doc.rect(46, tableTop, pageWidth, 20).fill(BRAND);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#ffffff");
    cols.forEach((c, i) => {
      const cx = colX[i];
      if (cx === undefined) return;
      doc.text(c.label, cx + 4, tableTop + 6, { width: c.w - 8, align: c.align });
    });

    data.lines.forEach((line, idx) => {
      const y = tableTop + 20 + idx * rowH;
      if (idx % 2 === 0) {
        doc.rect(46, y, pageWidth, rowH).fill("#f8fafc");
      }
      doc.font("Helvetica").fontSize(9).fillColor(INK);
      doc.text(line.subject + (line.code ? ` (${line.code})` : ""), (colX[0] ?? 46) + 4, y + 7, {
        width: cols[0]!.w - 8,
        align: "left",
      });
      const cell = (colIdx: number, value: string, color = INK, bold = false) => {
        const cx = colX[colIdx];
        const cw = cols[colIdx];
        if (cx === undefined || cw === undefined) return;
        doc
          .font(bold ? "Helvetica-Bold" : "Helvetica")
          .fontSize(9)
          .fillColor(color)
          .text(value, cx + 4, y + 7, { width: cw.w - 8, align: "center" });
      };
      cell(1, line.maxMarks);
      cell(2, line.passMarks);
      cell(3, line.theoryMarks ?? "—");
      cell(4, line.practicalMarks ?? "—");
      cell(5, line.obtained ?? "AB", INK, true);
      cell(
        6,
        line.status === "pass" ? "PASS" : line.status === "fail" ? "FAIL" : "ABSENT",
        statusColor(line.status),
        true,
      );
    });

    const tableBottom = tableTop + 20 + data.lines.length * rowH;
    doc.rect(46, tableBottom, pageWidth, 20).fill(BRAND_LIGHT);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(BRAND);
    doc.text("TOTAL / OVERALL", (colX[0] ?? 46) + 4, tableBottom + 6, { width: cols[0]!.w - 8 });
    doc.font("Helvetica-Bold").fontSize(9).fillColor(INK);
    doc.text(data.totalMax, colX[1]! + 4, tableBottom + 5.5, {
      width: cols[1]!.w - 8,
      align: "center",
    });
    doc.text(data.totalObtained, colX[5]! + 4, tableBottom + 5.5, {
      width: cols[5]!.w - 8,
      align: "center",
    });

    // ── Result summary ───────────────────────────────────────────────────
    doc.y = tableBottom + 34;
    const summaryTop = doc.y;
    doc.roundedRect(46, summaryTop, pageWidth, 54, 6).lineWidth(1).strokeColor(BRAND).stroke();
    const sc = [
      { label: "PERCENTAGE", value: `${data.percentage}%` },
      { label: "GRADE", value: data.grade ?? "—" },
      { label: "RESULT", value: data.resultStatus.toUpperCase() },
      {
        label: "ATTENDANCE",
        value:
          data.attendancePresent !== null && data.attendanceTotal !== null
            ? `${data.attendancePresent} / ${data.attendanceTotal} days`
            : "—",
      },
    ];
    const sw = pageWidth / sc.length;
    sc.forEach((s, i) => {
      const sx = 46 + i * sw;
      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor(MUTED)
        .text(s.label, sx, summaryTop + 10, { width: sw, align: "center" });
      doc
        .font("Helvetica-Bold")
        .fontSize(15)
        .fillColor(s.label === "RESULT" ? (data.resultStatus === "pass" ? PASS : FAIL) : BRAND)
        .text(s.value, sx, summaryTop + 22, { width: sw, align: "center" });
    });
    doc.y = summaryTop + 70;

    // ── Signatures ───────────────────────────────────────────────────────
    doc.moveDown(1.2);
    const sigY = Math.min(doc.y + 26, doc.page.height - 110);
    doc.font("Helvetica").fontSize(9).fillColor(INK);
    const sigLine = (x: number, width: number, label: string) => {
      doc
        .moveTo(x, sigY)
        .lineTo(x + width, sigY)
        .lineWidth(0.7)
        .strokeColor(INK)
        .stroke();
      doc.text(label, x, sigY + 5, { width, align: "center" });
    };
    sigLine(60, 130, "Class Teacher");
    sigLine(46 + pageWidth / 2 - 65, 130, "Principal");
    doc
      .fontSize(7)
      .fillColor(MUTED)
      .text(
        `Date of issue: ${new Date(data.generatedAt).toLocaleDateString("en-IN")}`,
        46,
        sigY + 26,
        { width: pageWidth, align: "center" },
      );

    // ── Footer ───────────────────────────────────────────────────────────
    doc.fontSize(6.5).fillColor(MUTED);
    doc.text(
      `Computer-generated report card. Generated by School ERP on ${new Date(data.generatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST. For corrections, contact the school office.`,
      46,
      doc.page.height - 58,
      { width: pageWidth, align: "center", lineBreak: false },
    );

    doc.end();
  });
}

/** Minimal PDF receipt for fee payments (mirrors the old renderReceiptHtml stub). */
export function renderReceiptPdf(data: {
  receiptNumber: string;
  invoiceNumber: string;
  schoolName: string;
  studentName: string;
  admissionNumber: string;
  amountPaise: number;
  mode: string;
  paidOn: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A5", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const rupees = (paise: number) =>
      "₹" +
      (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    doc.rect(40, 40, doc.page.width - 80, 3).fill(BRAND);
    doc.moveDown(0.5);
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(MUTED)
      .text(data.schoolName.toUpperCase(), { align: "center" });
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor(BRAND)
      .text("FEE RECEIPT", { align: "center" });
    doc.moveDown(0.3);
    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(MUTED)
      .text(`Receipt ${data.receiptNumber}  ·  against Invoice ${data.invoiceNumber}`, {
        align: "center",
      });
    doc.moveDown(1);
    const line = (label: string, value: string) => {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(MUTED)
        .text(label.toUpperCase(), { continued: false });
      doc.font("Helvetica-Bold").fontSize(11).fillColor(INK).text(value);
      doc.moveDown(0.4);
    };
    line("Received from", `${data.studentName}  (${data.admissionNumber})`);
    line("Amount", rupees(data.amountPaise));
    line("Mode of payment", data.mode.replace(/_/g, " ").toUpperCase());
    line(
      "Date",
      new Date(data.paidOn).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    );
    doc.moveDown(0.5);
    doc
      .rect(40, doc.y, doc.page.width - 80, 1)
      .strokeColor(BRAND)
      .stroke();
    doc.moveDown(0.5);
    doc
      .fontSize(7.5)
      .fillColor(MUTED)
      .text("This is a computer-generated receipt and is valid without signature.", {
        align: "center",
      });
    doc.end();
  });
}
