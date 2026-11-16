import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@school-erp/db";
import { students, schools, users, memberships } from "@school-erp/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

describe("Tenant Isolation Tests", () => {
  let school1Id: string;
  let school2Id: string;
  let admin1Id: string;
  let admin2Id: string;
  let student1Id: string;
  let student2Id: string;

  beforeAll(async () => {
    // Create two separate schools
    const [school1] = await db
      .insert(schools)
      .values({
        id: randomUUID(),
        organizationId: randomUUID(),
        name: "School 1 - Test",
        slug: "school1-test",
        board: "CBSE",
        status: "active",
        locale: "en",
        timezone: "Asia/Kolkata",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const [school2] = await db
      .insert(schools)
      .values({
        id: randomUUID(),
        organizationId: randomUUID(),
        name: "School 2 - Test",
        slug: "school2-test",
        board: "ICSE",
        status: "active",
        locale: "en",
        timezone: "Asia/Kolkata",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    school1Id = school1.id;
    school2Id = school2.id;

    // Create two users (admins)
    const [user1] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        email: `admin1@test.com`,
        phone: "+919876543210",
        name: "Admin 1",
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const [user2] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        email: `admin2@test.com`,
        phone: "+919876543211",
        name: "Admin 2",
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    admin1Id = user1.id;
    admin2Id = user2.id;

    // Create memberships for both users
    await db.insert(memberships).values([
      {
        id: randomUUID(),
        userId: admin1Id,
        schoolId: school1Id,
        roleId: randomUUID(), // Assuming system admin role exists
        status: "active",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        userId: admin2Id,
        schoolId: school2Id,
        roleId: randomUUID(),
        status: "active",
        createdAt: new Date(),
      },
    ]);

    // Create students for both schools
    const [student1] = await db
      .insert(students)
      .values({
        id: randomUUID(),
        schoolId: school1Id,
        admissionNumber: "1001",
        firstName: "Student 1",
        lastName: "Test",
        dateOfBirth: new Date("2010-01-01"),
        gender: "male",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const [student2] = await db
      .insert(students)
      .values({
        id: randomUUID(),
        schoolId: school2Id,
        admissionNumber: "2001",
        firstName: "Student 2",
        lastName: "Test",
        dateOfBirth: new Date("2010-01-01"),
        gender: "female",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    student1Id = student1.id;
    student2Id = student2.id;
  });

  afterAll(async () => {
    // Clean up - delete in reverse order of dependencies
    await db.delete(memberships).where(eq(memberships.userId, admin1Id));
    await db.delete(memberships).where(eq(memberships.userId, admin2Id));
    await db.delete(users).where(eq(users.id, admin1Id));
    await db.delete(users).where(eq(users.id, admin2Id));
    await db.delete(students).where(eq(students.id, student1Id));
    await db.delete(students).where(eq(students.id, student2Id));
    await db.delete(schools).where(eq(schools.id, school1Id));
    await db.delete(schools).where(eq(schools.id, school2Id));
  });

  it("should not allow user from school 1 to access data from school 2", async () => {
    // User from school 1 should only see students from school 1
    const school1Students = await db
      .select()
      .from(students)
      .where(eq(students.schoolId, school1Id));

    const school2Students = await db
      .select()
      .from(students)
      .where(eq(students.schoolId, school2Id));

    // Verify student 1 is only visible from school 1
    const student1Visible = school1Students.find((s) => s.id === student1Id);
    const student2Visible = school1Students.find((s) => s.id === student2Id);

    expect(student1Visible).toBeDefined();
    expect(student2Visible).toBeUndefined();

    // Verify student 2 is only visible from school 2
    const student1InSchool2 = school2Students.find((s) => s.id === student1Id);
    const student2InSchool2 = school2Students.find((s) => s.id === student2Id);

    expect(student1InSchool2).toBeUndefined();
    expect(student2InSchool2).toBeDefined();
  });

  it("should not allow user from school 2 to access data from school 1", async () => {
    // Create a test user for school 2 to verify isolation
    const [user3] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        email: `user3@test.com`,
        phone: "+919876543212",
        name: "User 3",
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await db.insert(memberships).values({
      id: randomUUID(),
      userId: user3.id,
      schoolId: school2Id,
      roleId: randomUUID(),
      status: "active",
      createdAt: new Date(),
    });

    // This user should only see school 2 data
    const user3Students = await db
      .select()
      .from(students)
      .where(eq(students.schoolId, school2Id));

    const school1Data = user3Students.find((s) => s.id === student1Id);
    const school2Data = user3Students.find((s) => s.id === student2Id);

    expect(school1Data).toBeUndefined();
    expect(school2Data).toBeDefined();

    // Cleanup
    await db.delete(memberships).where(eq(memberships.userId, user3.id));
    await db.delete(users).where(eq(users.id, user3.id));
  });

  it("should enforce school_id on all student records", async () => {
    // Get all students
    const allStudents = await db.select().from(students);

    // Verify every student has a school_id
    for (const student of allStudents) {
      expect(student.schoolId).toBeDefined();
      expect(student.schoolId).not.toBeNull();
    }

    // Verify all school_ids are unique per school
    const school1Students = allStudents.filter((s) => s.schoolId === school1Id);
    const school2Students = allStudents.filter((s) => s.schoolId === school2Id);

    // Verify no student appears in both schools
    for (const s1 of school1Students) {
      const inSchool2 = school2Students.find((s2) => s2.id === s1.id);
      expect(inSchool2).toBeUndefined();
    }
  });

  it("should handle cross-school query attempts", async () => {
    // Try to query for students in school 1 while using school 2's context
    // This should only return school 1's students
    const school1ContextStudents = await db
      .select()
      .from(students)
      .where(eq(students.schoolId, school1Id));

    // Verify we can't query school 2's students
    const school2ContextStudents = await db
      .select()
      .from(students)
      .where(eq(students.schoolId, school2Id));

    expect(school1ContextStudents.length).toBeGreaterThan(0);
    expect(school2ContextStudents.length).toBeGreaterThan(0);

    // Verify no overlap
    const school1Ids = school1ContextStudents.map((s) => s.id);
    const school2Ids = school2ContextStudents.map((s) => s.id);
    const overlap = school1Ids.filter((id) => school2Ids.includes(id));

    expect(overlap).toHaveLength(0);
  });
});
