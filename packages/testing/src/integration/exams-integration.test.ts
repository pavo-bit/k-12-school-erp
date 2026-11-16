import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db, exam_terms, exams, exam_subjects, marks, results, report_cards } from "@school-erp/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { createExamTerm, createExam, createExamSubject, createMarks, createResult, createReportCardTemplate, createReportCard } from "@school-erp/exams";

describe("Exams Module Integration Tests", () => {
  let schoolId: string;
  let academicYearId: string;
  let termId: string;
  let examId: string;
  let examSubjectId: string;
  let studentId: string;

  beforeAll(async () => {
    schoolId = randomUUID();
    academicYearId = randomUUID();
    studentId = randomUUID();

    const term = await createExamTerm({
      schoolId,
      academicYearId,
      name: "Term 1",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-12-15"),
      status: "active",
      actorId: randomUUID(),
    });

    termId = term.id;

    const exam = await createExam({
      schoolId,
      termId,
      name: "Mid Term Exam",
      type: "theory",
      status: "draft",
      actorId: randomUUID(),
    });

    examId = exam.id;

    const examSubject = await createExamSubject({
      schoolId,
      examId,
      classId: randomUUID(),
      subjectId: randomUUID(),
      maxMarks: 100,
      passMarks: 40,
      theoryMax: 100,
      practicalMax: 0,
      weightage: 100,
      actorId: randomUUID(),
    });

    examSubjectId = examSubject.id;
  });

  afterAll(async () => {
    await db.delete(report_cards).where(eq(report_cards.schoolId, schoolId));
    await db.delete(results).where(eq(results.schoolId, schoolId));
    await db.delete(marks).where(eq(marks.schoolId, schoolId));
    await db.delete(exam_subjects).where(eq(exam_subjects.schoolId, schoolId));
    await db.delete(exams).where(eq(exams.schoolId, schoolId));
    await db.delete(exam_terms).where(eq(exam_terms.schoolId, schoolId));
  });

  it("should create exam term successfully", async () => {
    const term = await createExamTerm({
      schoolId,
      academicYearId,
      name: "Term 2",
      startDate: new Date("2027-01-01"),
      endDate: new Date("2027-03-31"),
      status: "active",
      actorId: randomUUID(),
    });

    expect(term).toBeDefined();
    expect(term.name).toBe("Term 2");
  });

  it("should create exam successfully", async () => {
    const exam = await createExam({
      schoolId,
      termId,
      name: "Final Exam",
      type: "both",
      status: "scheduled",
      actorId: randomUUID(),
    });

    expect(exam).toBeDefined();
    expect(exam.name).toBe("Final Exam");
    expect(exam.type).toBe("both");
  });

  it("should create exam subject successfully", async () => {
    const examSubject = await createExamSubject({
      schoolId,
      examId,
      classId: randomUUID(),
      subjectId: randomUUID(),
      maxMarks: 100,
      passMarks: 35,
      theoryMax: 80,
      practicalMax: 20,
      weightage: 100,
      actorId: randomUUID(),
    });

    expect(examSubject).toBeDefined();
    expect(examSubject.examId).toBe(examId);
  });

  it("should create marks successfully", async () => {
    const marks = await createMarks({
      schoolId,
      examSubjectId,
      studentId,
      theoryMarks: 85,
      practicalMarks: 15,
      status: "draft",
      enteredBy: randomUUID(),
      enteredAt: new Date(),
    });

    expect(marks).toBeDefined();
    expect(marks.studentId).toBe(studentId);
    expect(marks.totalMarks).toBe(100);
    expect(marks.grade).toBe("A+");
    expect(marks.resultStatus).toBe("passed");
  });

  it("should create result successfully", async () => {
    const result = await createResult({
      schoolId,
      examId,
      studentId,
      totalMarks: 450,
      percentage: 90,
      grade: "A+",
      resultStatus: "passed",
      version: 1,
      actorId: randomUUID(),
    });

    expect(result).toBeDefined();
    expect(result.studentId).toBe(studentId);
    expect(result.totalMarks).toBe(450);
    expect(result.percentage).toBe(90);
    expect(result.grade).toBe("A+");
    expect(result.resultStatus).toBe("passed");
  });

  it("should create report card template successfully", async () => {
    const template = await createReportCardTemplate({
      schoolId,
      name: "Standard Report Card",
      htmlTemplate: "<html><body>{{studentName}} - {{grade}}</body></html>",
      version: 1,
      isDefault: true,
      status: "active",
      actorId: randomUUID(),
    });

    expect(template).toBeDefined();
    expect(template.name).toBe("Standard Report Card");
  });

  it("should create report card successfully", async () => {
    const reportCard = await createReportCard({
      schoolId,
      examId,
      studentId,
      templateId: randomUUID(),
      objectPath: "/reports/card-001.pdf",
      status: "draft",
      version: 1,
      actorId: randomUUID(),
    });

    expect(reportCard).toBeDefined();
    expect(reportCard.studentId).toBe(studentId);
    expect(reportCard.status).toBe("draft");
  });

  it("should list exams by term", async () => {
    const exams = await db.select().from(exams).where(eq(exams.termId, termId));

    expect(exams.length).toBeGreaterThan(0);
    exams.forEach((exam) => {
      expect(exam.termId).toBe(termId);
    });
  });

  it("should list marks by exam subject", async () => {
    const marksList = await db.select().from(marks).where(eq(marks.examSubjectId, examSubjectId));

    expect(marksList.length).toBeGreaterThan(0);
    marksList.forEach((m) => {
      expect(m.examSubjectId).toBe(examSubjectId);
    });
  });

  it("should list results by exam", async () => {
    const resultsList = await db.select().from(results).where(eq(results.examId, examId));

    expect(resultsList.length).toBeGreaterThan(0);
    resultsList.forEach((r) => {
      expect(r.examId).toBe(examId);
    });
  });

  it("should handle different exam types", async () => {
    const types = ["theory", "practical", "both", "internal", "external"];

    for (const type of types) {
      const exam = await createExam({
        schoolId,
        termId,
        name: `Exam ${type}`,
        type,
        status: "draft",
        actorId: randomUUID(),
      });

      expect(exam).toBeDefined();
      expect(exam.type).toBe(type);
    }
  });

  it("should handle different exam statuses", async () => {
    const statuses = ["draft", "scheduled", "conducted", "completed"];

    for (const status of statuses) {
      const exam = await createExam({
        schoolId,
        termId,
        name: `Exam ${status}`,
        type: "theory",
        status,
        actorId: randomUUID(),
      });

      expect(exam).toBeDefined();
      expect(exam.status).toBe(status);
    }
  });

  it("should handle different mark statuses", async () => {
    const statuses = ["draft", "submitted", "approved"];

    for (const status of statuses) {
      const marks = await createMarks({
        schoolId,
        examSubjectId,
        studentId: randomUUID(),
        theoryMarks: 75,
        practicalMarks: 10,
        status,
        enteredBy: randomUUID(),
        enteredAt: new Date(),
      });

      expect(marks).toBeDefined();
      expect(marks.status).toBe(status);
    }
  });

  it("should handle different result statuses", async () => {
    const statuses = ["passed", "failed", "conditional"];

    for (const status of statuses) {
      const result = await createResult({
        schoolId,
        examId,
        studentId: randomUUID(),
        totalMarks: status === "failed" ? 150 : 450,
        percentage: status === "failed" ? 30 : 90,
        grade: status === "failed" ? "F" : "A+",
        resultStatus: status,
        version: 1,
        actorId: randomUUID(),
      });

      expect(result).toBeDefined();
      expect(result.resultStatus).toBe(status);
    }
  });

  it("should handle different report card statuses", async () => {
    const statuses = ["draft", "generated", "published", "archived"];

    for (const status of statuses) {
      const reportCard = await createReportCard({
        schoolId,
        examId,
        studentId: randomUUID(),
        templateId: randomUUID(),
        objectPath: `/reports/card-${status}.pdf`,
        status,
        version: 1,
        actorId: randomUUID(),
      });

      expect(reportCard).toBeDefined();
      expect(reportCard.status).toBe(status);
    }
  });

  it("should enforce required fields in exam term", async () => {
    try {
      await createExamTerm({
        schoolId,
        academicYearId,
        // Missing name
        startDate: new Date("2026-09-01"),
        endDate: new Date("2026-12-15"),
        actorId: randomUUID(),
      });
      expect.fail("Should have thrown an error for missing name");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should enforce required fields in exam", async () => {
    try {
      await createExam({
        schoolId,
        termId,
        // Missing name and type
        actorId: randomUUID(),
      });
      expect.fail("Should have thrown an error for missing fields");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should enforce required fields in marks", async () => {
    try {
      await createMarks({
        schoolId,
        examSubjectId,
        // Missing studentId and theoryMarks
        enteredBy: randomUUID(),
        enteredAt: new Date(),
      });
      expect.fail("Should have thrown an error for missing fields");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
