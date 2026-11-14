import {
  db,
  staff,
  leaveTypes,
  leaveBalances,
  leaveRequests,
  salaryComponents,
  salaryStructures,
  salaryStructureLines,
  payrollRuns,
  payrollItems,
  payslips,
} from "@school-erp/db";
import { eq, and } from "drizzle-orm";
import { writeAudit } from "@school-erp/db";
import { randomUUID } from "node:crypto";

export interface CreateStaffInput {
  schoolId: string;
  userId?: string;
  employeeCode: string;
  designationId?: string | undefined;
  departmentId?: string | undefined;
  joiningDate: string;
  actorId: string;
}

export async function createStaff(input: CreateStaffInput) {
  const id = randomUUID();
  await db.insert(staff).values({
    id,
    schoolId: input.schoolId,
    userId: input.userId ?? null,
    employeeCode: input.employeeCode,
    designationId: input.designationId ?? null,
    departmentId: input.departmentId ?? null,
    joiningDate: input.joiningDate,
    status: "active",
  });
  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "staff.created",
    entityType: "staff",
    entityId: id,
    after: { employeeCode: input.employeeCode },
  });
  return { id, employeeCode: input.employeeCode };
}

export async function listStaff(schoolId: string) {
  return db.select().from(staff).where(eq(staff.schoolId, schoolId));
}

export async function getStaff(schoolId: string, staffId: string) {
  const rows = await db
    .select()
    .from(staff)
    .where(and(eq(staff.schoolId, schoolId), eq(staff.id, staffId)))
    .limit(1);
  return rows[0] ?? null;
}

export interface CreateLeaveTypeInput {
  schoolId: string;
  name: string;
  quota: number;
  carryForward: boolean;
  paid: boolean;
  actorId: string;
}

export async function createLeaveType(input: CreateLeaveTypeInput) {
  const id = randomUUID();
  await db.insert(leaveTypes).values({
    id,
    schoolId: input.schoolId,
    name: input.name,
    quota: input.quota,
    carryForward: input.carryForward,
    paid: input.paid,
  });
  return { id, name: input.name };
}

export async function listLeaveTypes(schoolId: string) {
  return db.select().from(leaveTypes).where(eq(leaveTypes.schoolId, schoolId));
}

export interface CreateLeaveRequestInput {
  schoolId: string;
  staffId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  actorId: string;
}

export async function createLeaveRequest(input: CreateLeaveRequestInput) {
  const id = randomUUID();
  await db.insert(leaveRequests).values({
    id,
    schoolId: input.schoolId,
    staffId: input.staffId,
    leaveTypeId: input.leaveTypeId,
    fromDate: input.fromDate,
    toDate: input.toDate,
    status: "pending",
  });
  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "leave.requested",
    entityType: "leave_request",
    entityId: id,
  });
  return { id, status: "pending" };
}

export async function approveLeaveRequest(schoolId: string, requestId: string, approverId: string) {
  await db
    .update(leaveRequests)
    .set({ status: "approved", approvedBy: approverId })
    .where(eq(leaveRequests.id, requestId));
  await writeAudit({
    scope: "school",
    schoolId,
    actorId: approverId,
    action: "leave.approved",
    entityType: "leave_request",
    entityId: requestId,
  });
  return { id: requestId, status: "approved" };
}

export interface CreateSalaryComponentInput {
  schoolId: string;
  name: string;
  type: "earning" | "deduction";
  calculation: "fixed" | "percentage";
  statutory: boolean;
  actorId: string;
}

export async function createSalaryComponent(input: CreateSalaryComponentInput) {
  const id = randomUUID();
  await db.insert(salaryComponents).values({
    id,
    schoolId: input.schoolId,
    name: input.name,
    type: input.type,
    calculation: input.calculation,
    statutory: input.statutory,
  });
  return { id, name: input.name };
}

export async function listSalaryComponents(schoolId: string) {
  return db.select().from(salaryComponents).where(eq(salaryComponents.schoolId, schoolId));
}

export interface CreateSalaryStructureInput {
  schoolId: string;
  staffId: string;
  effectiveFrom: string;
  lines: { componentId: string; amountPaise: number; percentage?: number }[];
  actorId: string;
}

export async function createSalaryStructure(input: CreateSalaryStructureInput) {
  const id = randomUUID();
  await db.insert(salaryStructures).values({
    id,
    schoolId: input.schoolId,
    staffId: input.staffId,
    effectiveFrom: input.effectiveFrom,
    status: "active",
  });
  for (const line of input.lines) {
    await db.insert(salaryStructureLines).values({
      id: randomUUID(),
      schoolId: input.schoolId,
      structureId: id,
      componentId: line.componentId,
      amountPaise: line.amountPaise,
      percentage: line.percentage != null ? String(line.percentage) : null,
    });
  }
  return { id };
}

export async function listSalaryStructures(schoolId: string, staffId?: string) {
  if (staffId) {
    return db
      .select()
      .from(salaryStructures)
      .where(and(eq(salaryStructures.schoolId, schoolId), eq(salaryStructures.staffId, staffId)));
  }
  return db.select().from(salaryStructures).where(eq(salaryStructures.schoolId, schoolId));
}

export interface CreatePayrollRunInput {
  schoolId: string;
  month: string;
  actorId: string;
}

export async function createPayrollRun(input: CreatePayrollRunInput) {
  const id = randomUUID();
  await db.insert(payrollRuns).values({
    id,
    schoolId: input.schoolId,
    month: input.month,
    status: "draft",
    preparedBy: input.actorId,
  });
  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "payroll.run_created",
    entityType: "payroll_run",
    entityId: id,
    after: { month: input.month },
  });
  return { id, month: input.month, status: "draft" };
}

export async function approvePayrollRun(schoolId: string, runId: string, approverId: string) {
  await db
    .update(payrollRuns)
    .set({ status: "approved", approvedBy: approverId, lockedAt: new Date() })
    .where(eq(payrollRuns.id, runId));
  await writeAudit({
    scope: "school",
    schoolId,
    actorId: approverId,
    action: "payroll.approved",
    entityType: "payroll_run",
    entityId: runId,
  });
  return { id: runId, status: "approved" };
}

export async function listPayrollRuns(schoolId: string) {
  return db.select().from(payrollRuns).where(eq(payrollRuns.schoolId, schoolId));
}

export async function addPayrollItem(
  schoolId: string,
  runId: string,
  staffId: string,
  grossPaise: number,
  deductionsPaise: number,
) {
  const id = randomUUID();
  const netPaise = grossPaise - deductionsPaise;
  await db.insert(payrollItems).values({
    id,
    schoolId,
    runId,
    staffId,
    gross: grossPaise,
    deductions: deductionsPaise,
    net: netPaise,
    version: 1,
  });
  return { id, grossPaise, deductionsPaise, netPaise };
}

export async function listPayrollItems(runId: string) {
  return db.select().from(payrollItems).where(eq(payrollItems.runId, runId));
}
