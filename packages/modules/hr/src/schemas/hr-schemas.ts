import { z } from "zod";

// Staff schemas
export const CreateStaffSchema = z.object({
  schoolId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  employeeCode: z.string().min(1).max(50),
  designationId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  joiningDate: z.string().datetime(),
  status: z.enum(["active", "inactive", "on_leave", "resigned", "terminated"]).default("active"),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15).optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  actorId: z.string(),
});

export const UpdateStaffSchema = z.object({
  employeeCode: z.string().min(1).max(50).optional(),
  designationId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  joiningDate: z.string().datetime().optional(),
  status: z.enum(["active", "inactive", "on_leave", "resigned", "terminated"]).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15).optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

export const StaffResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  userId: z.string().nullable(),
  employeeCode: z.string(),
  designationId: z.string().nullable(),
  departmentId: z.string().nullable(),
  joiningDate: z.date(),
  status: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  dateOfBirth: z.date().nullable(),
  gender: z.string().nullable(),
  bloodGroup: z.string().nullable(),
  emergencyContact: z.string().nullable(),
  emergencyContactPhone: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Leave Type schemas
export const CreateLeaveTypeSchema = z.object({
  schoolId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  daysAllowed: z.number().int().min(0),
  carryForward: z.boolean().default(false),
  carryForwardLimit: z.number().int().min(0).optional(),
  paid: z.boolean().default(true),
  requiresApproval: z.boolean().default(true),
  actorId: z.string(),
});

export const UpdateLeaveTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  daysAllowed: z.number().int().min(0).optional(),
  carryForward: z.boolean().optional(),
  carryForwardLimit: z.number().int().min(0).optional(),
  paid: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
});

export const LeaveTypeResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  daysAllowed: z.number(),
  carryForward: z.boolean(),
  carryForwardLimit: z.number().nullable(),
  paid: z.boolean(),
  requiresApproval: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Leave Policy schemas
export const CreateLeavePolicySchema = z.object({
  schoolId: z.string().uuid(),
  leaveTypeId: z.string().uuid(),
  yearsOfService: z.number().int().min(0).max(50),
  daysAllowed: z.number().int().min(0),
  actorId: z.string(),
});

export const LeavePolicyResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  leaveTypeId: z.string().uuid(),
  yearsOfService: z.number(),
  daysAllowed: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Leave Balance schemas
export const CreateLeaveBalanceSchema = z.object({
  schoolId: z.string().uuid(),
  staffId: z.string().uuid(),
  leaveTypeId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  balance: z.number().int().min(0),
  carriedForward: z.number().int().min(0).default(0),
  used: z.number().int().min(0).default(0),
  actorId: z.string(),
});

export const LeaveBalanceResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  staffId: z.string().uuid(),
  leaveTypeId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  balance: z.number(),
  carriedForward: z.number(),
  used: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Leave Request schemas
export const CreateLeaveRequestSchema = z.object({
  schoolId: z.string().uuid(),
  staffId: z.string().uuid(),
  leaveTypeId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  fromDate: z.string().datetime(),
  toDate: z.string().datetime(),
  daysRequested: z.number().int().min(1),
  reason: z.string().min(1).max(500),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).default("pending"),
  actorId: z.string(),
  approvedBy: z.string().optional(),
});

export const UpdateLeaveRequestSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
  reason: z.string().min(1).max(500).optional(),
  approvedBy: z.string().optional(),
});

export const LeaveRequestResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  staffId: z.string().uuid(),
  leaveTypeId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  fromDate: z.date(),
  toDate: z.date(),
  daysRequested: z.number(),
  daysApproved: z.number(),
  reason: z.string(),
  status: z.string(),
  actorId: z.string(),
  approvedBy: z.string().nullable(),
  approvedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Salary Component schemas
export const CreateSalaryComponentSchema = z.object({
  schoolId: z.string().uuid(),
  name: z.string().min(1).max(200),
  type: z.enum(["earning", "deduction"]),
  calculation: z.string().min(1).max(500), // Formula or percentage
  statutory: z.boolean().default(false),
  isTaxable: z.boolean().default(false),
  actorId: z.string(),
});

export const UpdateSalaryComponentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["earning", "deduction"]).optional(),
  calculation: z.string().min(1).max(500).optional(),
  statutory: z.boolean().optional(),
  isTaxable: z.boolean().optional(),
});

export const SalaryComponentResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  calculation: z.string(),
  statutory: z.boolean(),
  isTaxable: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Salary Structure schemas
export const CreateSalaryStructureSchema = z.object({
  schoolId: z.string().uuid(),
  staffId: z.string().uuid(),
  effectiveFrom: z.string().datetime(),
  status: z.enum(["draft", "active", "expired"]).default("draft"),
  actorId: z.string(),
});

export const SalaryStructureLineSchema = z.object({
  salaryComponentId: z.string().uuid(),
  amountPaise: z.number().int().min(0),
  percentage: z.number().min(0).max(100).optional(),
});

export const CreateSalaryStructureSchemaWithLines = CreateSalaryStructureSchema.extend({
  salaryStructureLines: SalaryStructureLineSchema.array(),
});

export const SalaryStructureResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  staffId: z.string().uuid(),
  effectiveFrom: z.date(),
  effectiveTo: z.date().nullable(),
  status: z.string(),
  totalEarningsPaise: z.number(),
  totalDeductionsPaise: z.number(),
  netSalaryPaise: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Payroll Run schemas
export const CreatePayrollRunSchema = z.object({
  schoolId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  status: z.enum(["draft", "prepared", "approved", "processed", "closed"]).default("draft"),
  preparedBy: z.string(),
  approvedBy: z.string().optional(),
});

export const UpdatePayrollRunSchema = z.object({
  status: z.enum(["draft", "prepared", "approved", "processed", "closed"]).optional(),
  preparedBy: z.string().optional(),
  approvedBy: z.string().optional(),
});

export const PayrollRunResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  month: z.number(),
  year: z.number(),
  status: z.string(),
  preparedBy: z.string(),
  approvedBy: z.string().nullable(),
  processedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Payroll Item schemas
export const CreatePayrollItemSchema = z.object({
  schoolId: z.string().uuid(),
  payrollRunId: z.string().uuid(),
  staffId: z.string().uuid(),
  grossPaise: z.number().int().min(0),
  deductionsPaise: z.number().int().min(0),
  netPaise: z.number().int().min(0),
  version: z.number().int().min(1).default(1),
  actorId: z.string(),
});

export const UpdatePayrollItemSchema = z.object({
  grossPaise: z.number().int().min(0).optional(),
  deductionsPaise: z.number().int().min(0).optional(),
  netPaise: z.number().int().min(0).optional(),
  version: z.number().int().min(1).optional(),
});

export const PayrollItemResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  payrollRunId: z.string().uuid(),
  staffId: z.string().uuid(),
  staffName: z.string(),
  grossPaise: z.number(),
  deductionsPaise: z.number(),
  netPaise: z.number(),
  version: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Payslip schemas
export const PayslipResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  payrollItemId: z.string().uuid(),
  objectPath: z.string(),
  issuedAt: z.date(),
  createdAt: z.date(),
});

// Statutory Rate schemas
export const CreateStatutoryRateSchema = z.object({
  schoolId: z.string().uuid().optional(),
  type: z.enum(["epf", "esic", "pt", "gst", "other"]),
  effectiveFrom: z.string().datetime(),
  config: z.any(),
  actorId: z.string(),
});

export const StatutoryRateResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid().nullable(),
  type: z.string(),
  effectiveFrom: z.date(),
  effectiveTo: z.date().nullable(),
  config: z.any(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
