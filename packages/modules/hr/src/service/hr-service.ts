import {
  db,
  staff,
  staff_documents,
  leave_types,
  leave_policies,
  leave_balances,
  leave_requests,
  salary_components,
  salary_structures,
  salary_structure_lines,
  payroll_runs,
  payroll_items,
  payslips,
  statutory_rates,
} from "@school-erp/db";
import { eq, and, desc, sql, gte, lte, sum } from "drizzle-orm";
import { writeAudit } from "@school-erp/db";
import { randomUUID } from "node:crypto";

// Staff operations
export interface CreateStaffInput {
  schoolId: string;
  userId?: string;
  employeeCode: string;
  designationId?: string;
  departmentId?: string;
  joiningDate: Date;
  status?: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: Date;
  gender?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  emergencyContactPhone?: string;
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
    status: input.status ?? "active",
    email: input.email ?? null,
    phone: input.phone ?? null,
    address: input.address ?? null,
    dateOfBirth: input.dateOfBirth ?? null,
    gender: input.gender ?? null,
    bloodGroup: input.bloodGroup ?? null,
    emergencyContact: input.emergencyContact ?? null,
    emergencyContactPhone: input.emergencyContactPhone ?? null,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "staff.created",
    entityType: "staff",
    entityId: id,
    after: { employeeCode: input.employeeCode, email: input.email, phone: input.phone },
  });

  return { id, employeeCode: input.employeeCode, email: input.email, phone: input.phone };
}

export async function getStaff(id: string) {
  const rows = await db.select().from(staff).where(eq(staff.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getStaffByEmployeeCode(schoolId: string, employeeCode: string) {
  const rows = await db
    .select()
    .from(staff)
    .where(eq(staff.schoolId, schoolId), eq(staff.employeeCode, employeeCode))
    .limit(1);
  return rows[0] ?? null;
}

export async function listStaff(schoolId: string, status?: string) {
  const query = db.select().from(staff).where(eq(staff.schoolId, schoolId));
  if (status) {
    query.where(eq(staff.status, status));
  }
  return query.orderBy(desc(staff.createdAt));
}

export async function updateStaff(id: string, input: any, actorId: string) {
  const existing = await getStaff(id);
  if (!existing) {
    throw new Error("Staff not found");
  }

  const updates: any = { updatedAt: new Date() };
  if (input.employeeCode !== undefined) updates.employeeCode = input.employeeCode;
  if (input.designationId !== undefined) updates.designationId = input.designationId;
  if (input.departmentId !== undefined) updates.departmentId = input.departmentId;
  if (input.joiningDate !== undefined) updates.joiningDate = input.joiningDate;
  if (input.status !== undefined) updates.status = input.status;
  if (input.email !== undefined) updates.email = input.email;
  if (input.phone !== undefined) updates.phone = input.phone;
  if (input.address !== undefined) updates.address = input.address;
  if (input.dateOfBirth !== undefined) updates.dateOfBirth = input.dateOfBirth;
  if (input.gender !== undefined) updates.gender = input.gender;
  if (input.bloodGroup !== undefined) updates.bloodGroup = input.bloodGroup;
  if (input.emergencyContact !== undefined) updates.emergencyContact = input.emergencyContact;
  if (input.emergencyContactPhone !== undefined) updates.emergencyContactPhone = input.emergencyContactPhone;

  await db.update(staff).set(updates).where(eq(staff.id, id));
  await writeAudit({
    scope: "school",
    schoolId: existing.schoolId,
    actorId,
    action: "staff.updated",
    entityType: "staff",
    entityId: id,
    before: existing,
    after: { ...existing, ...updates },
  });

  return { id, ...updates };
}

// Leave Type operations
export interface CreateLeaveTypeInput {
  schoolId: string;
  name: string;
  description?: string;
  daysAllowed: number;
  carryForward?: boolean;
  carryForwardLimit?: number;
  paid?: boolean;
  requiresApproval?: boolean;
  actorId: string;
}

export async function createLeaveType(input: CreateLeaveTypeInput) {
  const id = randomUUID();
  await db.insert(leave_types).values({
    id,
    schoolId: input.schoolId,
    name: input.name,
    description: input.description ?? null,
    daysAllowed: input.daysAllowed,
    carryForward: input.carryForward ?? false,
    carryForwardLimit: input.carryForwardLimit ?? null,
    paid: input.paid ?? true,
    requiresApproval: input.requiresApproval ?? true,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "leave_type.created",
    entityType: "leave_type",
    entityId: id,
    after: { name: input.name, daysAllowed: input.daysAllowed },
  });

  return { id, name: input.name, daysAllowed: input.daysAllowed };
}

export async function getLeaveType(id: string) {
  const rows = await db.select().from(leave_types).where(eq(leave_types.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listLeaveTypes(schoolId: string) {
  return db.select().from(leave_types).where(eq(leave_types.schoolId, schoolId)).orderBy(leave_types.name);
}

// Leave Policy operations
export interface CreateLeavePolicyInput {
  schoolId: string;
  leaveTypeId: string;
  yearsOfService: number;
  daysAllowed: number;
  actorId: string;
}

export async function createLeavePolicy(input: CreateLeavePolicyInput) {
  const id = randomUUID();
  await db.insert(leave_policies).values({
    id,
    schoolId: input.schoolId,
    leaveTypeId: input.leaveTypeId,
    yearsOfService: input.yearsOfService,
    daysAllowed: input.daysAllowed,
  });

  return { id, leaveTypeId: input.leaveTypeId, yearsOfService: input.yearsOfService, daysAllowed: input.daysAllowed };
}

// Leave Balance operations
export interface CreateLeaveBalanceInput {
  schoolId: string;
  staffId: string;
  leaveTypeId: string;
  academicYearId: string;
  balance: number;
  carriedForward?: number;
  used?: number;
  actorId: string;
}

export async function createLeaveBalance(input: CreateLeaveBalanceInput) {
  const id = randomUUID();
  await db.insert(leave_balances).values({
    id,
    schoolId: input.schoolId,
    staffId: input.staffId,
    leaveTypeId: input.leaveTypeId,
    academicYearId: input.academicYearId,
    balance: input.balance,
    carriedForward: input.carriedForward ?? 0,
    used: input.used ?? 0,
  });

  return { id, staffId: input.staffId, leaveTypeId: input.leaveTypeId, balance: input.balance };
}

export async function getLeaveBalance(schoolId: string, staffId: string, leaveTypeId: string, academicYearId: string) {
  const rows = await db
    .select()
    .from(leave_balances)
    .where(eq(leave_balances.schoolId, schoolId), eq(leave_balances.staffId, staffId), eq(leave_balances.leaveTypeId, leaveTypeId), eq(leave_balances.academicYearId, academicYearId))
    .limit(1);
  return rows[0] ?? null;
}

export async function listLeaveBalances(schoolId: string, staffId: string, academicYearId: string) {
  return db
    .select()
    .from(leave_balances)
    .where(eq(leave_balances.schoolId, schoolId), eq(leave_balances.staffId, staffId), eq(leave_balances.academicYearId, academicYearId));
}

// Leave Request operations
export interface CreateLeaveRequestInput {
  schoolId: string;
  staffId: string;
  leaveTypeId: string;
  academicYearId: string;
  fromDate: Date;
  toDate: Date;
  daysRequested: number;
  reason: string;
  status?: string;
  actorId: string;
  approvedBy?: string;
}

export async function createLeaveRequest(input: CreateLeaveRequestInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(leave_requests).values({
    id,
    schoolId: input.schoolId,
    staffId: input.staffId,
    leaveTypeId: input.leaveTypeId,
    academicYearId: input.academicYearId,
    fromDate: input.fromDate,
    toDate: input.toDate,
    daysRequested: input.daysRequested,
    reason: input.reason,
    status: input.status ?? "pending",
    actorId: input.actorId,
    approvedBy: input.approvedBy ?? null,
    approvedAt: input.status === "approved" ? now : null,
  });

  // Update leave balance
  const balance = await getLeaveBalance(input.schoolId, input.staffId, input.leaveTypeId, input.academicYearId);
  if (balance) {
    await db
      .update(leave_balances)
      .set({ used: balance.used + input.daysRequested, updatedAt: now })
      .where(eq(leave_balances.id, balance.id));
  }

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "leave_request.created",
    entityType: "leave_request",
    entityId: id,
    after: { staffId: input.staffId, leaveTypeId: input.leaveTypeId, daysRequested: input.daysRequested, status: input.status ?? "pending" },
  });

  return { id, staffId: input.staffId, leaveTypeId: input.leaveTypeId, daysRequested: input.daysRequested, status: input.status ?? "pending" };
}

export async function getLeaveRequest(id: string) {
  const rows = await db.select().from(leave_requests).where(eq(leave_requests.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listLeaveRequests(schoolId: string, staffId?: string, status?: string) {
  const query = db.select().from(leave_requests).where(eq(leave_requests.schoolId, schoolId));
  if (staffId) {
    query.where(eq(leave_requests.staffId, staffId));
  }
  if (status) {
    query.where(eq(leave_requests.status, status));
  }
  return query.orderBy(desc(leave_requests.createdAt));
}

export async function updateLeaveRequest(id: string, input: any, actorId: string) {
  const existing = await getLeaveRequest(id);
  if (!existing) {
    throw new Error("Leave request not found");
  }

  const updates: any = { updatedAt: new Date() };
  if (input.status !== undefined) updates.status = input.status;
  if (input.reason !== undefined) updates.reason = input.reason;
  if (input.approvedBy !== undefined) updates.approvedBy = input.approvedBy;
  if (input.status === "approved" && !existing.approvedAt) {
    updates.approvedAt = new Date();
  }

  await db.update(leave_requests).set(updates).where(eq(leave_requests.id, id));
  await writeAudit({
    scope: "school",
    schoolId: existing.schoolId,
    actorId,
    action: "leave_request.updated",
    entityType: "leave_request",
    entityId: id,
    before: existing,
    after: { ...existing, ...updates },
  });

  return { id, ...updates };
}

// Salary Component operations
export interface CreateSalaryComponentInput {
  schoolId: string;
  name: string;
  type: string;
  calculation: string;
  statutory?: boolean;
  isTaxable?: boolean;
  actorId: string;
}

export async function createSalaryComponent(input: CreateSalaryComponentInput) {
  const id = randomUUID();
  await db.insert(salary_components).values({
    id,
    schoolId: input.schoolId,
    name: input.name,
    type: input.type,
    calculation: input.calculation,
    statutory: input.statutory ?? false,
    isTaxable: input.isTaxable ?? false,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "salary_component.created",
    entityType: "salary_component",
    entityId: id,
    after: { name: input.name, type: input.type },
  });

  return { id, name: input.name, type: input.type };
}

export async function getSalaryComponent(id: string) {
  const rows = await db.select().from(salary_components).where(eq(salary_components.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listSalaryComponents(schoolId: string) {
  return db.select().from(salary_components).where(eq(salary_components.schoolId, schoolId)).orderBy(salary_components.name);
}

// Salary Structure operations
export interface CreateSalaryStructureInput {
  schoolId: string;
  staffId: string;
  effectiveFrom: Date;
  status?: string;
  salaryStructureLines?: Array<{ salaryComponentId: string; amountPaise: number; percentage?: number }>;
  actorId: string;
}

export async function createSalaryStructure(input: CreateSalaryStructureInput) {
  const id = randomUUID();

  // Insert salary structure
  await db.insert(salary_structures).values({
    id,
    schoolId: input.schoolId,
    staffId: input.staffId,
    effectiveFrom: input.effectiveFrom,
    status: input.status ?? "draft",
  });

  // Insert salary structure lines
  if (input.salaryStructureLines && input.salaryStructureLines.length > 0) {
    for (const line of input.salaryStructureLines) {
      await db.insert(salary_structure_lines).values({
        id: randomUUID(),
        schoolId: input.schoolId,
        salaryStructureId: id,
        salaryComponentId: line.salaryComponentId,
        amountPaise: line.amountPaise,
        percentage: line.percentage ?? null,
      });
    }
  }

  return { id, staffId: input.staffId, effectiveFrom: input.effectiveFrom, status: input.status ?? "draft" };
}

// Payroll Run operations
export interface CreatePayrollRunInput {
  schoolId: string;
  month: number;
  year: number;
  status?: string;
  preparedBy?: string;
  approvedBy?: string;
  actorId: string;
}

export async function createPayrollRun(input: CreatePayrollRunInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(payroll_runs).values({
    id,
    schoolId: input.schoolId,
    month: input.month,
    year: input.year,
    status: input.status ?? "draft",
    preparedBy: input.preparedBy ?? null,
    approvedBy: input.approvedBy ?? null,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "payroll_run.created",
    entityType: "payroll_run",
    entityId: id,
    after: { month: input.month, year: input.year, status: input.status ?? "draft" },
  });

  return { id, month: input.month, year: input.year, status: input.status ?? "draft" };
}

export async function getPayrollRun(id: string) {
  const rows = await db.select().from(payroll_runs).where(eq(payroll_runs.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listPayrollRuns(schoolId: string, month?: number, year?: number) {
  const query = db.select().from(payroll_runs).where(eq(payroll_runs.schoolId, schoolId));
  if (month) {
    query.where(eq(payroll_runs.month, month));
  }
  if (year) {
    query.where(eq(payroll_runs.year, year));
  }
  return query.orderBy(desc(payroll_runs.year), desc(payroll_runs.month));
}

export async function updatePayrollRun(id: string, input: any, actorId: string) {
  const existing = await getPayrollRun(id);
  if (!existing) {
    throw new Error("Payroll run not found");
  }

  const updates: any = { updatedAt: new Date() };
  if (input.status !== undefined) updates.status = input.status;
  if (input.preparedBy !== undefined) updates.preparedBy = input.preparedBy;
  if (input.approvedBy !== undefined) updates.approvedBy = input.approvedBy;

  await db.update(payroll_runs).set(updates).where(eq(payroll_runs.id, id));
  await writeAudit({
    scope: "school",
    schoolId: existing.schoolId,
    actorId,
    action: "payroll_run.updated",
    entityType: "payroll_run",
    entityId: id,
    before: existing,
    after: { ...existing, ...updates },
  });

  return { id, ...updates };
}

// Payroll Item operations
export interface CreatePayrollItemInput {
  schoolId: string;
  payrollRunId: string;
  staffId: string;
  grossPaise: number;
  deductionsPaise: number;
  netPaise: number;
  version?: number;
  actorId: string;
}

export async function createPayrollItem(input: CreatePayrollItemInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(payroll_items).values({
    id,
    schoolId: input.schoolId,
    payrollRunId: input.payrollRunId,
    staffId: input.staffId,
    grossPaise: input.grossPaise,
    deductionsPaise: input.deductionsPaise,
    netPaise: input.netPaise,
    version: input.version ?? 1,
  });

  await writeAudit({
    scope: "school",
    schoolId: input.schoolId,
    actorId: input.actorId,
    action: "payroll_item.created",
    entityType: "payroll_item",
    entityId: id,
    after: { staffId: input.staffId, netPaise: input.netPaise },
  });

  return { id, staffId: input.staffId, netPaise: input.netPaise };
}

export async function getPayrollItem(id: string) {
  const rows = await db.select().from(payroll_items).where(eq(payroll_items.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listPayrollItems(schoolId: string, payrollRunId?: string) {
  const query = db.select().from(payroll_items).where(eq(payroll_items.schoolId, schoolId));
  if (payrollRunId) {
    query.where(eq(payroll_items.payrollRunId, payrollRunId));
  }
  return query.orderBy(payroll_items.staffId);
}

// Statutory Rate operations
export interface CreateStatutoryRateInput {
  schoolId?: string;
  type: string;
  effectiveFrom: Date;
  config: any;
  actorId: string;
}

export async function createStatutoryRate(input: CreateStatutoryRateInput) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(statutory_rates).values({
    id,
    schoolId: input.schoolId ?? null,
    type: input.type,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: null,
    config: input.config,
  });

  return { id, type: input.type, effectiveFrom: input.effectiveFrom };
}

export async function getStatutoryRate(schoolId: string, type: string) {
  const rows = await db
    .select()
    .from(statutory_rates)
    .where(eq(statutory_rates.schoolId, schoolId), eq(statutory_rates.type, type))
    .orderBy(desc(statutory_rates.effectiveFrom))
    .limit(1);
  return rows[0] ?? null;
}

export async function listStatutoryRates(schoolId: string) {
  return db.select().from(statutory_rates).where(eq(statutory_rates.schoolId, schoolId)).orderBy(statutory_rates.type, desc(statutory_rates.effectiveFrom));
}
