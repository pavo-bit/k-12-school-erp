import { describe, it, expect } from "vitest";
import { renderReportCardPdf, renderReceiptPdf, type ReportCardData } from "./report-card.js";

const baseCard: ReportCardData = {
  schoolName: "Greenwood High School",
  academicYear: "2027-28",
  examName: "Class 10 Unit Test 2",
  examType: "both",
  termName: "Term 2 (2027-28)",
  studentName: "Aarav Sharma",
  admissionNumber: "STU001",
  className: "Class 10",
  sectionName: "A",
  rollNumber: "12",
  dateOfBirth: "2010-05-15",
  lines: [
    {
      subject: "Mathematics",
      code: "MATH",
      maxMarks: "100",
      passMarks: "40",
      theoryMarks: "58",
      practicalMarks: "24",
      obtained: "82",
      status: "pass",
    },
    {
      subject: "Science",
      code: "SCI",
      maxMarks: "100",
      passMarks: "40",
      theoryMarks: "61",
      practicalMarks: "26",
      obtained: "87",
      status: "pass",
    },
    {
      subject: "English",
      code: "ENG",
      maxMarks: "100",
      passMarks: "40",
      theoryMarks: "74",
      practicalMarks: null,
      obtained: "74",
      status: "pass",
    },
  ],
  totalMax: "300",
  totalObtained: "243",
  percentage: "81",
  grade: "A2",
  resultStatus: "pass",
  attendancePresent: 20,
  attendanceTotal: 22,
  generatedAt: "2026-11-17T10:00:00.000Z",
};

describe("renderReportCardPdf", () => {
  it("produces a valid single-page A4 PDF", async () => {
    const pdf = await renderReportCardPdf(baseCard);
    expect(pdf.length).toBeGreaterThan(1500);
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    const head = pdf.subarray(0, Math.min(pdf.length, 4096)).toString("latin1");
    const tail = pdf.subarray(pdf.length - 64).toString("latin1");
    expect(tail).toContain("%%EOF");
    expect(head).toContain("%PDF-1.");
    // single page
    expect(pdf.toString("latin1")).toContain("/Count 1");
  });

  it("tolerates absent marks and empty subject list", async () => {
    const absent: ReportCardData = {
      ...baseCard,
      lines: [],
      totalMax: "0",
      totalObtained: "0",
      percentage: "0",
      grade: null,
      resultStatus: "fail",
      attendancePresent: null,
      attendanceTotal: null,
    };
    const pdf = await renderReportCardPdf(absent);
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(1200);
  });
});

describe("renderReceiptPdf", () => {
  it("produces a valid A5-ish PDF receipt", async () => {
    const pdf = await renderReceiptPdf({
      receiptNumber: "RCP-000001",
      invoiceNumber: "INV-000001",
      schoolName: "Greenwood High School",
      studentName: "Aarav Sharma",
      admissionNumber: "STU001",
      amountPaise: 500000,
      mode: "upi",
      paidOn: "2026-11-14T10:00:00.000Z",
    });
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(800);
  });
});
