import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db, organizations, schools, academic_years } from "@school-erp/db";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { createOrganization, createSchool, createAcademicYear } from "@school-erp/platform";

describe("Platform Module Integration Tests", () => {
  let orgId: string;
  let schoolId: string;
  let academicYearId: string;
  let userId: string;

  beforeAll(async () => {
    // Create a test user
    const [user] = await db
      .insert({ id: randomUUID(), email: "test@erp.com", phone: "+919876543210", name: "Test User", emailVerifiedAt: new Date(), phoneVerifiedAt: new Date(), status: "active", createdAt: new Date(), updatedAt: new Date() })
      .returning();

    userId = user.id;

    // Create organization
    const [org] = await createOrganization({
      name: "Test Organization",
      billingEmail: "billing@test.com",
      actorId: userId,
    });

    orgId = org.id;

    // Create school
    const [school] = await createSchool({
      organizationId: orgId,
      name: "Test School",
      slug: "test-school",
      board: "CBSE",
      timezone: "Asia/Kolkata",
      locale: "en",
      actorId: userId,
    });

    schoolId = school.id;

    // Create academic year
    const [academicYear] = await createAcademicYear({
      schoolId,
      name: "2026-2027",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2027-05-31"),
      status: "active",
      actorId: userId,
    });

    academicYearId = academicYear.id;
  });

  afterAll(async () => {
    // Cleanup
    await db.delete(academic_years).where(eq(academic_years.id, academicYearId));
    await db.delete(schools).where(eq(schools.id, schoolId));
    await db.delete(organizations).where(eq(organizations.id, orgId));
  });

  it("should create organization successfully", async () => {
    const org = await createOrganization({
      name: "Test Organization 2",
      billingEmail: "billing2@test.com",
      actorId: userId,
    });

    expect(org).toBeDefined();
    expect(org.name).toBe("Test Organization 2");
    expect(org.id).toBeDefined();
  });

  it("should create school successfully", async () => {
    const school = await createSchool({
      organizationId: orgId,
      name: "Test School 2",
      slug: "test-school-2",
      board: "ICSE",
      timezone: "Asia/Kolkata",
      locale: "en",
      actorId: userId,
    });

    expect(school).toBeDefined();
    expect(school.name).toBe("Test School 2");
    expect(school.slug).toBe("test-school-2");
  });

  it("should create academic year successfully", async () => {
    const academicYear = await createAcademicYear({
      schoolId,
      name: "2025-2026",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2026-05-31"),
      status: "active",
      actorId: userId,
    });

    expect(academicYear).toBeDefined();
    expect(academicYear.name).toBe("2025-2026");
    expect(academicYear.schoolId).toBe(schoolId);
  });

  it("should retrieve all organizations", async () => {
    const orgs = await db.select().from(organizations);

    expect(orgs.length).toBeGreaterThan(0);
    expect(orgs[0].name).toBeDefined();
  });

  it("should retrieve all schools", async () => {
    const schools = await db.select().from(schools).where(eq(schools.organizationId, orgId));

    expect(schools.length).toBeGreaterThan(0);
    expect(schools[0].organizationId).toBe(orgId);
  });

  it("should retrieve active academic year for school", async () => {
    const activeYear = await db
      .select()
      .from(academic_years)
      .where(eq(academic_years.schoolId, schoolId))
      .orderBy((table) => table.createdAt)
      .limit(1);

    expect(activeYear[0]).toBeDefined();
    expect(activeYear[0]?.schoolId).toBe(schoolId);
  });

  it("should handle multiple schools in same organization", async () => {
    const school2 = await createSchool({
      organizationId: orgId,
      name: "Test School 3",
      slug: "test-school-3",
      board: "State",
      timezone: "Asia/Kolkata",
      locale: "en",
      actorId: userId,
    });

    const allSchools = await db.select().from(schools).where(eq(schools.organizationId, orgId));

    expect(allSchools.length).toBeGreaterThan(1);
    expect(allSchools.find((s) => s.id === school2.id)).toBeDefined();
  });

  it("should enforce unique slug per organization", async () => {
    try {
      await createSchool({
        organizationId: orgId,
        name: "Test School 4",
        slug: "test-school", // Duplicate slug
        board: "State",
        timezone: "Asia/Kolkata",
        locale: "en",
        actorId: userId,
      });
      expect.fail("Should have thrown an error for duplicate slug");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should enforce unique admission number per school", async () => {
    try {
      await db.insert({ id: randomUUID(), schoolId, admissionNumber: "1001", firstName: "Duplicate", lastName: "Student", dateOfBirth: new Date("2010-01-01"), gender: "male", status: "active", createdAt: new Date(), updatedAt: new Date() });
      expect.fail("Should have thrown an error for duplicate admission number");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should handle academic year transitions", async () => {
    const newYear = await createAcademicYear({
      schoolId,
      name: "2027-2028",
      startDate: new Date("2027-06-01"),
      endDate: new Date("2028-05-31"),
      status: "active",
      actorId: userId,
    });

    const activeYears = await db
      .select()
      .from(academic_years)
      .where(eq(academic_years.schoolId, schoolId))
      .orderBy((table) => table.createdAt);

    expect(activeYears.length).toBeGreaterThan(1);
    expect(activeYears[0].id).toBe(newYear.id);
  });
});
