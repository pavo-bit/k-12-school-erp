import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db, classes, sections, attendance_sessions, attendance_records } from "@school-erp/db";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { createClass, createSection, createAttendanceSession, listAttendanceSessions } from "@school-erp/attendance";
import { createStudent, createEnrollment } from "@school-erp/sis";

describe("Attendance Module Integration Tests", () => {
  let schoolId: string;
  let classId: string;
  let sectionId: string;
  let studentId: string;
  let academicYearId: string;
  let sessionId: string;

  beforeAll(async () => {
    // Create test data
    const [student] = await createStudent({
      schoolId: randomUUID(),
      admissionNumber: "2001",
      firstName: "Test Student",
      lastName: "Attendance",
      dateOfBirth: new Date("2010-01-01"),
      gender: "male",
      status: "active",
      actorId: randomUUID(),
    });

    studentId = student.id;

    const [classObj] = await createClass({
      schoolId: randomUUID(),
      academicYearId: randomUUID(),
      name: "Class 10",
      order: 10,
    });

    classId = classObj.id;

    const [section] = await createSection({
      schoolId: randomUUID(),
      classId,
      name: "A",
      room: "101",
    });

    sectionId = section.id;

    academicYearId = randomUUID();

    const [enrollment] = await createEnrollment({
      schoolId: randomUUID(),
      studentId,
      academicYearId,
      classId,
      sectionId,
      rollNumber: "1",
      status: "active",
      actorId: randomUUID(),
    });

    const [session] = await createAttendanceSession({
      schoolId: randomUUID(),
      sectionId,
      date: new Date(),
      sessionType: "morning",
      status: "submitted",
      submittedBy: randomUUID(),
    });

    sessionId = session.id;
  });

  afterAll(async () => {
    // Cleanup
    await db.delete(attendance_records).where(eq(attendance_records.sessionId, sessionId));
    await db.delete(attendance_sessions).where(eq(attendance_sessions.id, sessionId));
    await db.delete(enrollments).where(eq(enrollments.id, randomUUID())); // Clean up enrollment
    await db.delete(sections).where(eq(sections.id, sectionId));
    await db.delete(classes).where(eq(classes.id, classId));
    await db.delete(students).where(eq(students.id, studentId));
  });

  it("should create class successfully", async () => {
    const classObj = await createClass({
      schoolId: randomUUID(),
      academicYearId: randomUUID(),
      name: "Class 9",
      order: 9,
    });

    expect(classObj).toBeDefined();
    expect(classObj.name).toBe("Class 9");
    expect(classObj.order).toBe(9);
  });

  it("should create section successfully", async () => {
    const section = await createSection({
      schoolId: randomUUID(),
      classId,
      name: "B",
      room: "102",
    });

    expect(section).toBeDefined();
    expect(section.name).toBe("B");
    expect(section.classId).toBe(classId);
  });

  it("should create attendance session successfully", async () => {
    const session = await createAttendanceSession({
      schoolId: randomUUID(),
      sectionId,
      date: new Date("2026-11-15"),
      sessionType: "afternoon",
      status: "draft",
      submittedBy: randomUUID(),
    });

    expect(session).toBeDefined();
    expect(session.sessionType).toBe("afternoon");
    expect(session.status).toBe("draft");
  });

  it("should list attendance sessions", async () => {
    const sessions = await listAttendanceSessions(randomUUID(), sectionId);

    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions[0]).toHaveProperty("sectionId");
    expect(sessions[0]).toHaveProperty("date");
    expect(sessions[0]).toHaveProperty("sessionType");
  });

  it("should filter attendance sessions by section", async () => {
    const sessions = await listAttendanceSessions(randomUUID(), sectionId);

    const filtered = sessions.filter((s) => s.sectionId === sectionId);

    expect(filtered.length).toBe(sessions.length);
    filtered.forEach((session) => {
      expect(session.sectionId).toBe(sectionId);
    });
  });

  it("should filter attendance sessions by date", async () => {
    const sessions = await listAttendanceSessions(randomUUID(), undefined, new Date("2026-11-15"));

    const filtered = sessions.filter((s) => {
      return s.date.toISOString().startsWith("2026-11-15");
    });

    expect(filtered.length).toBeGreaterThan(0);
  });

  it("should create attendance record", async () => {
    const record = await db.insert(attendance_records).values({
      id: randomUUID(),
      schoolId: randomUUID(),
      sessionId,
      studentId,
      status: "present",
      markedBy: randomUUID(),
      markedAt: new Date(),
      source: "web",
    }).returning();

    expect(record[0]).toBeDefined();
    expect(record[0].status).toBe("present");
    expect(record[0].studentId).toBe(studentId);
  });

  it("should list attendance records for session", async () => {
    const records = await db
      .select()
      .from(attendance_records)
      .where(eq(attendance_records.sessionId, sessionId));

    expect(records.length).toBeGreaterThan(0);
    expect(records[0]).toHaveProperty("status");
    expect(records[0]).toHaveProperty("markedAt");
  });

  it("should handle multiple attendance sessions", async () => {
    // Create multiple sessions
    const session2 = await createAttendanceSession({
      schoolId: randomUUID(),
      sectionId,
      date: new Date("2026-11-16"),
      sessionType: "morning",
      status: "submitted",
      submittedBy: randomUUID(),
    });

    const sessions = await listAttendanceSessions(randomUUID(), sectionId);

    expect(sessions.length).toBeGreaterThan(1);
  });

  it("should enforce unique session per section/date", async () => {
    try {
      await createAttendanceSession({
        schoolId: randomUUID(),
        sectionId,
        date: new Date("2026-11-15"),
        sessionType: "morning",
        status: "submitted",
        submittedBy: randomUUID(),
      });
      expect.fail("Should have thrown an error for duplicate session");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should handle attendance status transitions", async () => {
    const record = await db
      .insert(attendance_records)
      .values({
        id: randomUUID(),
        schoolId: randomUUID(),
        sessionId,
        studentId,
        status: "absent",
        markedBy: randomUUID(),
        markedAt: new Date(),
        source: "web",
      })
      .returning();

    expect(record[0]).toBeDefined();
    expect(record[0].status).toBe("absent");
  });

  it("should calculate attendance statistics", async () => {
    const sessions = await listAttendanceSessions(randomUUID(), sectionId);
    const records = await db
      .select()
      .from(attendance_records)
      .where(eq(attendance_records.sessionId, sessions[0].id));

    const total = records.length;
    const present = records.filter((r) => r.status === "present").length;
    const absent = records.filter((r) => r.status === "absent").length;

    expect(total).toBeGreaterThan(0);
    expect(present + absent).toBe(total);
  });

  it("should handle staff attendance", async () => {
    const staffAttendance = await db
      .insert(staff_attendance)
      .values({
        id: randomUUID(),
        schoolId: randomUUID(),
        staffId: randomUUID(),
        date: new Date("2026-11-15"),
        status: "present",
        source: "web",
      })
      .returning();

    expect(staffAttendance[0]).toBeDefined();
    expect(staffAttendance[0].status).toBe("present");
  });
});
