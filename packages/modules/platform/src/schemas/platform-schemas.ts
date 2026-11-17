import { z } from "zod";

// Organization schemas
export const CreateOrganizationSchema = z.object({
  name: z.string().min(1).max(200),
  billingEmail: z.string().email().optional(),
});

export const UpdateOrganizationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  billingEmail: z.string().email().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const OrganizationResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  billingEmail: z.string().nullable(),
  status: z.enum(["active", "inactive"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// School schemas
export const CreateSchoolSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  board: z.enum(["CBSE", "ICSE", "State", "IB", "IGCSE"]).optional(),
  timezone: z.string().default("Asia/Kolkata"),
  locale: z.enum(["en", "hi", "mr"]).default("en"),
});

export const UpdateSchoolSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  board: z.enum(["CBSE", "ICSE", "State", "IB", "IGCSE"]).optional(),
  timezone: z.string().optional(),
  locale: z.enum(["en", "hi", "mr"]).optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
});

export const SchoolResponseSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  board: z.string().nullable(),
  timezone: z.string(),
  locale: z.string(),
  status: z.enum(["active", "inactive", "suspended"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Academic Year schemas
export const CreateAcademicYearSchema = z.object({
  schoolId: z.string().uuid(),
  name: z.string().min(1).max(100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z.enum(["draft", "planning", "active", "closing", "closed"]).default("draft"),
});

export const AcademicYearResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  name: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.enum(["draft", "planning", "active", "closing", "closed"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Invitation schemas
export const CreateInvitationSchema = z.object({
  schoolId: z.string().uuid(),
  email: z.string().email(),
  roleId: z.string().uuid(),
  role: z.string().optional(), // Legacy field
});

export const InvitationResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  email: z.string(),
  roleId: z.string().uuid(),
  status: z.enum(["pending", "accepted", "expired", "cancelled"]),
  expiresAt: z.date(),
  createdAt: z.date(),
});

// Academic Year schemas
export const UpdateAcademicYearSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(["draft", "planning", "active", "closing", "closed"]).optional(),
});

// School Settings schemas
export const SchoolSettingsSchema = z.object({
  key: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.record(z.unknown())]),
});

export const SchoolSettingsUpdateSchema = z.object({
  key: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.record(z.unknown())]),
});
