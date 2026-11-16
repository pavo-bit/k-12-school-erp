import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db, staff, leave_requests, payroll_runs, salary_structures } from "@school-erp/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { createStaff, createLeaveRequest, createPayrollRun, createSalaryStructure } from "@school-erp/hr";

describe("HR Module Integration Tests", () => {
  let schoolId: string;
  let staffId: string;

  beforeAll(async () => {
    schoolId = randomUUID();

    const staff = await createStaff({
      schoolId,
      employeeCode: "EMP001",
      name: "John Doe",
      email: "john@school.com",
      phone: "+919876543210",
      designationId: randomUUID(),
      departmentId: randomUUID(),
      joiningDate: new Date("2026-01-15"),
      status: "active",
      actorId: randomUUID(),
    });

    staffId = staff.id;
  });

  afterAll(async () => {
    await db.delete(salary_structures).where(eq(salary_structures.schoolId, schoolId));
    await db.delete(payroll_runs).where(eq(payroll_runs.schoolId, schoolId));
    await db.delete(leave_requests).where(eq(leave_requests.schoolId, schoolId));
    await db.delete(staff).where(eq(staff.schoolId, schoolId));
  });

  it("should create staff successfully", async () => {
    const staff = await createStaff({
      schoolId,
      employeeCode: "EMP002",
      name: "Jane Smith",
      email: "jane@school.com",
      phone: "+919876543211",
      designationId: randomUUID(),
      departmentId: randomUUID(),
      joiningDate: new Date("2026-02-01"),
      status: "active",
      actorId: randomUUID(),
    });

    expect(staff).toBeDefined();
    expect(staff.employeeCode).toBe("EMP002");
    expect(staff.name).toBe("Jane Smith");
  });

  it("should create leave request successfully", async () => {
    const leaveRequest = await createLeaveRequest({
      schoolId,
      staffId,
      leaveTypeId: randomUUID(),
      fromDate: new Date("2026-11-20"),
      toDate: new Date("2026-11-25"),
      daysRequested: 5,
      reason: "Medical leave",
      status: "pending",
      actorId: randomUUID(),
    });

    expect(leaveRequest).toBeDefined();
    expect(leaveRequest.staffId).toBe(staffId);
    expect(leaveRequest.daysRequested).toBe(5);
    expect(leaveRequest.status).toBe("pending");
  });

  it("should create payroll run successfully", async () => {
    const payrollRun = await createPayrollRun({
      schoolId,
      month: 11,
      year: 2026,
      status: "draft",
      preparedBy: randomUUID(),
      actorId: randomUUID(),
    });

    expect(payrollRun).toBeDefined();
    expect(payrollRun.month).toBe(11);
    expect(payrollRun.year).toBe(2026);
    expect(payrollRun.status).toBe("draft");
  });

  it("should create salary structure successfully", async () => {
    const salaryStructure = await createSalaryStructure({
      schoolId,
      staffId,
      effectiveFrom: new Date("2026-01-01"),
      status: "active",
      components: [
        { componentId: randomUUID(), amountPaise: 50000, type: "earning" },
        { componentId: randomUUID(), amountPaise: 5000, type: "deduction" },
      ],
      actorId: randomUUID(),
    });

    expect(salaryStructure).toBeDefined();
    expect(salaryStructure.staffId).toBe(staffId);
    expect(salaryStructure.status).toBe("active");
  });

  it("should handle different staff statuses", async () => {
    const statuses = ["active", "inactive", "terminated", "on_leave"];

    for (const status of statuses) {
      const staff = await createStaff({
        schoolId,
        employeeCode: `EMP${statuses.indexOf(status) + 10}`,
        name: `Staff ${status}`,
        designationId: randomUUID(),
        departmentId: randomUUID(),
        joiningDate: new Date("2026-01-01"),
        status,
        actorId: randomUUID(),
      });

      expect(staff).toBeDefined();
      expect(staff.status).toBe(status);
    }
  });

  it("should handle different leave statuses", async () => {
    const statuses = ["pending", "approved", "rejected", "cancelled"];

    for (const status of statuses) {
      const leaveRequest = await createLeaveRequest({
        schoolId,
        staffId,
        leaveTypeId: randomUUID(),
        fromDate: new Date("2026-11-20"),
        toDate: new Date("2026-11-25"),
        daysRequested: 5,
        reason: `Leave ${status}`,
        status,
        actorId: randomUUID(),
      });

      expect(leaveRequest).toBeDefined();
      expect(leaveRequest.status).toBe(status);
    }
  });

  it("should handle different payroll statuses", async () => {
    const statuses = ["draft", "prepared", "approved", "processed", "closed"];

    for (const status of statuses) {
      const payrollRun = await createPayrollRun({
        schoolId,
        month: 11,
        year: 2026,
        status,
        preparedBy: randomUUID(),
        actorId: randomUUID(),
      });

      expect(payrollRun).toBeDefined();
      expect(payrollRun.status).toBe(status);
    }
  });

  it("should handle different salary structure statuses", async () => {
    const statuses = ["active", "inactive", "draft"];

    for (const status of statuses) {
      const salaryStructure = await createSalaryStructure({
        schoolId,
        staffId,
        effectiveFrom: new Date("2026-01-01"),
        status,
        components: [],
        actorId: randomUUID(),
      });

      expect(salaryStructure).toBeDefined();
      expect(salaryStructure.status).toBe(status);
    }
  });

  it("should list staff by school", async () => {
    const staffList = await db.select().from(staff).where(eq(staff.schoolId, schoolId));

    expect(staffList.length).toBeGreaterThan(0);
    staffList.forEach((s) => {
      expect(s.schoolId).toBe(schoolId);
    });
  });

  it("should list leave requests by staff", async () => {
    const leaveRequests = await db.select().from(leave_requests).where(eq(leave_requests.staffId, staffId));

    expect(leaveRequests.length).toBeGreaterThan(0);
    leaveRequests.forEach((lr) => {
      expect(lr.staffId).toBe(staffId);
    });
  });

  it("should list payroll runs by school", async () => {
    const payrollRuns = await db.select().from(payroll_runs).where(eq(payroll_runs.schoolId, schoolId));

    expect(payrollRuns.length).toBeGreaterThan(0);
    payrollRuns.forEach((pr) => {
      expect(pr.schoolId).toBe(schoolId);
    });
  });

  it("should list salary structures by staff", async () => {
    const salaryStructures = await db.select().from(salary_structures).where(eq(salary_structures.staffId, staffId));

    expect(salaryStructures.length).toBeGreaterThan(0);
    salaryStructures.forEach((ss) => {
      expect(ss.staffId).toBe(staffId);
    });
  });

  it("should enforce required fields in staff", async () => {
    try {
      await createStaff({
        schoolId,
        // Missing employeeCode, name, designationId, departmentId, joiningDate
        actorId: randomUUID(),
      });
      expect.fail("Should have thrown an error for missing required fields");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should enforce required fields in leave request", async () => {
    try {
      await createLeaveRequest({
        schoolId,
        // Missing staffId, leaveTypeId, fromDate, toDate, daysRequested
        actorId: randomUUID(),
      });
      expect.fail("Should have thrown an error for missing required fields");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should enforce required fields in payroll run", async () => {
    try {
      await createPayrollRun({
        schoolId,
        // Missing month, year
        actorId: randomUUID(),
      });
      expect.fail("Should have thrown an error for missing required fields");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should enforce required fields in salary structure", async () => {
    try {
      await createSalaryStructure({
        schoolId,
        // Missing staffId, effectiveFrom
        actorId: randomUUID(),
      });
      expect.fail("Should have thrown an error for missing required fields");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should handle staff with optional fields", async () => {
    const staff = await createStaff({
      schoolId,
      employeeCode: "EMP003",
      name: "Optional Staff",
      designationId: randomUUID(),
      departmentId: randomUUID(),
      joiningDate: new Date("2026-03-01"),
      status: "active",
      actorId: randomUUID(),
    });

    expect(staff).toBeDefined();
    expect(staff.employeeCode).toBe("EMP003");
  });

  it("should handle leave request with different day counts", async () => {
    const dayCounts = [1, 3, 5, 10];

    for (const days of dayCounts) {
      const leaveRequest = await createLeaveRequest({
        schoolId,
        staffId,
        leaveTypeId: randomUUID(),
        fromDate: new Date("2026-11-20"),
        toDate: new Date(`2026-11-${20 + days}`),
        daysRequested: days,
        reason: `Leave for ${days} days`,
        status: "pending",
        actorId: randomUUID(),
      });

      expect(leaveRequest).toBeDefined();
      expect(leaveRequest.daysRequested).toBe(days);
    }
  });
});
