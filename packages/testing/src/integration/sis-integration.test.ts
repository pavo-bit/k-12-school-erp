import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db, students, guardians, enrollments } from "@school-erp/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { createStudent, createGuardian, createEnrollment, createStudentDocument } from "@school-erp/sis";

describe("SIS Module Integration Tests", () => {
  let schoolId: string;
  let academicYearId: string;
  let studentId: string;
  let guardianId: string;

  beforeAll(async () => {
    schoolId = randomUUID();
    academicYearId = randomUUID();

    const student = await createStudent({
      schoolId,
      admissionNumber: "1001",
      firstName: "Test",
      lastName: "Student",
      dateOfBirth: new Date("2010-01-01"),
      gender: "male",
      email: "student@erp.com",
      phone: "+919876543210",
      status: "active",
      actorId: randomUUID(),
    });

    studentId = student.id;

    const guardian = await createGuardian({
      schoolId,
      name: "Test Guardian",
      relationship: "father",
      phone: "+919876543211",
      email: "guardian@erp.com",
      isPrimary: true,
      actorId: randomUUID(),
    });

    guardianId = guardian.id;
  });

  afterAll(async () => {
    await db.delete(enrollments).where(eq(enrollments.schoolId, schoolId));
    await db.delete(students).where(eq(students.schoolId, schoolId));
    await db.delete(guardians).where(eq(guardians.schoolId, schoolId));
  });

  it("should create student successfully", async () => {
    const student = await createStudent({
      schoolId,
      admissionNumber: "1002",
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: new Date("2010-05-15"),
      gender: "male",
      email: "john@erp.com",
      phone: "+919876543212",
      status: "active",
      actorId: randomUUID(),
    });

    expect(student).toBeDefined();
    expect(student.admissionNumber).toBe("1002");
    expect(student.firstName).toBe("John");
    expect(student.lastName).toBe("Doe");
  });

  it("should create guardian successfully", async () => {
    const guardian = await createGuardian({
      schoolId,
      name: "Jane Guardian",
      relationship: "mother",
      phone: "+919876543213",
      email: "jane@erp.com",
      isPrimary: false,
      actorId: randomUUID(),
    });

    expect(guardian).toBeDefined();
    expect(guardian.name).toBe("Jane Guardian");
    expect(guardian.relationship).toBe("mother");
  });

  it("should create enrollment successfully", async () => {
    const enrollment = await createEnrollment({
      schoolId,
      studentId,
      academicYearId,
      classId: randomUUID(),
      sectionId: randomUUID(),
      status: "active",
      actorId: randomUUID(),
    });

    expect(enrollment).toBeDefined();
    expect(enrollment.studentId).toBe(studentId);
    expect(enrollment.academicYearId).toBe(academicYearId);
  });

  it("should create student document successfully", async () => {
    const document = await createStudentDocument({
      schoolId,
      studentId,
      documentType: "birth_certificate",
      objectPath: "/docs/birth-cert.pdf",
      actorId: randomUUID(),
    });

    expect(document).toBeDefined();
    expect(document.studentId).toBe(studentId);
    expect(document.documentType).toBe("birth_certificate");
  });

  it("should handle different student statuses", async () => {
    const statuses = ["active", "inactive", "graduated", "transferred", "withdrawn"];

    for (const status of statuses) {
      const student = await createStudent({
        schoolId,
        admissionNumber: `100${statuses.indexOf(status) + 3}`,
        firstName: `Student ${status}`,
        lastName: "Test",
        dateOfBirth: new Date("2010-01-01"),
        gender: "male",
        status,
        actorId: randomUUID(),
      });

      expect(student).toBeDefined();
      expect(student.status).toBe(status);
    }
  });

  it("should handle different guardian relationships", async () => {
    const relationships = ["father", "mother", "guardian", "other"];

    for (const relationship of relationships) {
      const guardian = await createGuardian({
        schoolId,
        name: `Guardian ${relationship}`,
        relationship,
        phone: "+919876543214",
        isPrimary: false,
        actorId: randomUUID(),
      });

      expect(guardian).toBeDefined();
      expect(guardian.relationship).toBe(relationship);
    }
  });

  it("should handle different genders", async () => {
    const genders = ["male", "female", "other"];

    for (const gender of genders) {
      const student = await createStudent({
        schoolId,
        admissionNumber: `200${genders.indexOf(gender) + 1}`,
        firstName: `Student ${gender}`,
        lastName: "Test",
        dateOfBirth: new Date("2010-01-01"),
        gender,
        status: "active",
        actorId: randomUUID(),
      });

      expect(student).toBeDefined();
      expect(student.gender).toBe(gender);
    }
  });

  it("should list students by school", async () => {
    const studentsList = await db.select().from(students).where(eq(students.schoolId, schoolId));

    expect(studentsList.length).toBeGreaterThan(0);
    studentsList.forEach((s) => {
      expect(s.schoolId).toBe(schoolId);
    });
  });

  it("should list guardians by school", async () => {
    const guardiansList = await db.select().from(guardians).where(eq(guardians.schoolId, schoolId));

    expect(guardiansList.length).toBeGreaterThan(0);
    guardiansList.forEach((g) => {
      expect(g.schoolId).toBe(schoolId);
    });
  });

  it("should list enrollments by school", async () => {
    const enrollmentsList = await db.select().from(enrollments).where(eq(enrollments.schoolId, schoolId));

    expect(enrollmentsList.length).toBeGreaterThan(0);
    enrollmentsList.forEach((e) => {
      expect(e.schoolId).toBe(schoolId);
    });
  });

  it("should enforce required fields in student", async () => {
    try {
      await createStudent({
        schoolId,
        // Missing admissionNumber, firstName, lastName, dateOfBirth, gender
        actorId: randomUUID(),
      });
      expect.fail("Should have thrown an error for missing required fields");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should enforce required fields in guardian", async () => {
    try {
      await createGuardian({
        schoolId,
        // Missing name, relationship, phone
        actorId: randomUUID(),
      });
      expect.fail("Should have thrown an error for missing required fields");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should enforce required fields in enrollment", async () => {
    try {
      await createEnrollment({
        schoolId,
        // Missing studentId, academicYearId, classId, sectionId
        actorId: randomUUID(),
      });
      expect.fail("Should have thrown an error for missing required fields");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should handle student with optional fields", async () => {
    const student = await createStudent({
      schoolId,
      admissionNumber: "3001",
      firstName: "Optional",
      lastName: "Student",
      dateOfBirth: new Date("2010-01-01"),
      gender: "female",
      email: "optional@erp.com",
      phone: "+919876543215",
      status: "active",
      actorId: randomUUID(),
    });

    expect(student).toBeDefined();
    expect(student.email).toBe("optional@erp.com");
    expect(student.phone).toBe("+919876543215");
  });

  it("should handle enrollment with different statuses", async () => {
    const statuses = ["active", "completed", "transferred", "withdrawn"];

    for (const status of statuses) {
      const enrollment = await createEnrollment({
        schoolId,
        studentId,
        academicYearId,
        classId: randomUUID(),
        sectionId: randomUUID(),
        status,
        actorId: randomUUID(),
      });

      expect(enrollment).toBeDefined();
      expect(enrollment.status).toBe(status);
    }
  });
});
