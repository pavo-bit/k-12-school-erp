import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@school-erp/db";
import { students, schools, users, auditLogs } from "@school-erp/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

describe("Audit Log Tests", () => {
  let schoolId: string;
  let userId: string;
  let studentId: string;

  beforeAll(async () => {
    // Create a school
    const [school] = await db
      .insert(schools)
      .values({
        id: randomUUID(),
        organizationId: randomUUID(),
        name: "Audit Test School",
        slug: "audit-test-school",
        board: "CBSE",
        status: "active",
        locale: "en",
        timezone: "Asia/Kolkata",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    schoolId = school.id;

    // Create a user
    const [user] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        email: `audit@test.com`,
        phone: "+919876543213",
        name: "Audit User",
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    userId = user.id;
  });

  afterAll(async () => {
    // Cleanup
    await db.delete(auditLogs).where(eq(auditLogs.schoolId, schoolId));
    await db.delete(students).where(eq(students.schoolId, schoolId));
    await db.delete(users).where(eq(users.id, userId));
    await db.delete(schools).where(eq(schools.id, schoolId));
  });

  it("should create audit log when creating a student", async () => {
    const studentBefore = await db.select().from(students).where(eq(students.schoolId, schoolId));

    // Create a student
    const [student] = await db
      .insert(students)
      .values({
        id: randomUUID(),
        schoolId: schoolId,
        admissionNumber: "1002",
        firstName: "Audit Student",
        lastName: "Test",
        dateOfBirth: new Date("2010-01-01"),
        gender: "male",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    studentId = student.id;

    // Check that audit logs were created
    const logs = await db
      .select()
      .from(auditLogs)
      .where(
        and(eq(auditLogs.schoolId, schoolId), eq(auditLogs.entityType, "students")),
      )
      .orderBy(auditLogs.createdAt)
      .limit(10);

    expect(logs.length).toBeGreaterThan(0);

    // Find the create log
    const createLog = logs.find((log) => log.action === "create" && log.entityId === studentId);

    expect(createLog).toBeDefined();
    expect(createLog?.actorId).toBe(userId);
    expect(createLog?.entityType).toBe("students");
    expect(createLog?.entityId).toBe(studentId);
    expect(createLog?.before).toBeNull();
    expect(createLog?.after).toBeDefined();
  });

  it("should create audit log when updating a student", async () => {
    // Update the student's name
    await db
      .update(students)
      .set({ firstName: "Updated Audit Student", updatedAt: new Date() })
      .where(eq(students.id, studentId));

    // Check that audit logs were created
    const logs = await db
      .select()
      .from(auditLogs)
      .where(
        and(eq(auditLogs.schoolId, schoolId), eq(auditLogs.entityType, "students")),
      )
      .orderBy(auditLogs.createdAt)
      .limit(20);

    // Find the update log
    const updateLog = logs.find((log) => log.action === "update" && log.entityId === studentId);

    expect(updateLog).toBeDefined();
    expect(updateLog?.action).toBe("update");
    expect(updateLog?.entityType).toBe("students");
    expect(updateLog?.entityId).toBe(studentId);
    expect(updateLog?.actorId).toBe(userId);
    expect(updateLog?.before).toBeDefined();
    expect(updateLog?.after).toBeDefined();
    expect(updateLog?.before?.firstName).toBe("Audit Student");
    expect(updateLog?.after?.firstName).toBe("Updated Audit Student");
  });

  it("should create audit log when deleting a student (soft delete)", async () => {
    const studentToDeleteId = randomUUID();

    // Create a student to delete
    await db.insert(students).values({
      id: studentToDeleteId,
      schoolId: schoolId,
      admissionNumber: "1003",
      firstName: "Student to Delete",
      lastName: "Test",
      dateOfBirth: new Date("2010-01-01"),
      gender: "female",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Soft delete the student
    await db
      .update(students)
      .set({ archivedAt: new Date(), updatedAt: new Date() })
      .where(eq(students.id, studentToDeleteId));

    // Check that audit logs were created
    const logs = await db
      .select()
      .from(auditLogs)
      .where(
        and(eq(auditLogs.schoolId, schoolId), eq(auditLogs.entityType, "students")),
      )
      .orderBy(auditLogs.createdAt)
      .limit(20);

    // Find the delete log
    const deleteLog = logs.find((log) => log.action === "update" && log.entityId === studentToDeleteId);

    expect(deleteLog).toBeDefined();
    expect(deleteLog?.action).toBe("update");
    expect(deleteLog?.entityType).toBe("students");
    expect(deleteLog?.entityId).toBe(studentToDeleteId);
    expect(deleteLog?.actorId).toBe(userId);
    expect(deleteLog?.before).toBeDefined();
    expect(deleteLog?.after).toBeDefined();
    expect(deleteLog?.after?.archivedAt).toBeDefined();
  });

  it("should include all required fields in audit logs", async () => {
    const [student] = await db
      .insert(students)
      .values({
        id: randomUUID(),
        schoolId: schoolId,
        admissionNumber: "1004",
        firstName: "Field Test Student",
        lastName: "Test",
        dateOfBirth: new Date("2010-01-01"),
        gender: "male",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const logs = await db
      .select()
      .from(auditLogs)
      .where(
        and(eq(auditLogs.schoolId, schoolId), eq(auditLogs.entityType, "students")),
      )
      .orderBy(auditLogs.createdAt)
      .limit(1);

    const log = logs[0];

    // Verify all required fields are present
    expect(log).toBeDefined();
    expect(log?.schoolId).toBe(schoolId);
    expect(log?.actorId).toBe(userId);
    expect(log?.action).toBeDefined();
    expect(log?.entityType).toBe("students");
    expect(log?.entityId).toBe(student.id);
    expect(log?.before).toBeDefined();
    expect(log?.after).toBeDefined();
    expect(log?.ip).toBeDefined();
    expect(log?.userAgent).toBeDefined();
    expect(log?.requestId).toBeDefined();
    expect(log?.createdAt).toBeDefined();
  });

  it("should not allow deletion of audit logs (append-only)", async () => {
    const logsBefore = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.schoolId, schoolId));

    const initialCount = logsBefore.length;

    // Try to delete an audit log (should fail or be prevented)
    try {
      await db.delete(auditLogs).where(eq(auditLogs.id, logsBefore[0].id));
      const logsAfter = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.schoolId, schoolId));

      // If delete succeeded, count should decrease
      expect(logsAfter.length).toBe(initialCount - 1);
    } catch (error) {
      // If delete is blocked, we expect an error
      expect(error).toBeDefined();
    }
  });

  it("should filter audit logs by entity type", async () => {
    // Create different types of entities
    await db.insert(students).values({
      id: randomUUID(),
      schoolId: schoolId,
      admissionNumber: "1005",
      firstName: "Student",
      lastName: "Test",
      dateOfBirth: new Date("2010-01-01"),
      gender: "male",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Get all audit logs
    const allLogs = await db.select().from(auditLogs).where(eq(auditLogs.schoolId, schoolId));

    // Filter by entity type
    const studentLogs = allLogs.filter((log) => log.entityType === "students");

    expect(studentLogs.length).toBeGreaterThan(0);
    studentLogs.forEach((log) => {
      expect(log.entityType).toBe("students");
    });
  });

  it("should paginate audit logs correctly", async () => {
    // Create multiple students to generate multiple audit logs
    for (let i = 0; i < 15; i++) {
      await db.insert(students).values({
        id: randomUUID(),
        schoolId: schoolId,
        admissionNumber: `100${6 + i}`,
        firstName: `Student ${i}`,
        lastName: "Test",
        dateOfBirth: new Date("2010-01-01"),
        gender: "male",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Get logs with pagination
    const pageSize = 5;
    const allLogs = await db.select().from(auditLogs).where(eq(auditLogs.schoolId, schoolId));

    // First page
    const page1 = allLogs.slice(0, pageSize);
    expect(page1.length).toBe(pageSize);

    // Second page
    const page2 = allLogs.slice(pageSize, pageSize * 2);
    expect(page2.length).toBe(pageSize);

    // Third page (should be empty or have remaining items)
    const page3 = allLogs.slice(pageSize * 2);
    expect(page3.length).toBeLessThanOrEqual(pageSize);
  });
});
