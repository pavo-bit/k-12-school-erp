import { z } from "zod";

// Student schemas
export const CreateStudentSchema = z.object({
  schoolId: z.string().uuid(),
  admissionNumber: z.string().min(1).max(50),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100).optional(),
  dateOfBirth: z.string().datetime(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15).optional(),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  category: z.string().optional(),
  religion: z.string().optional(),
  caste: z.string().optional(),
  guardianId: z.string().uuid().optional(),
  status: z.enum(["active", "inactive", "transferred", "left"]).default("active"),
  actorId: z.string(),
});

export const UpdateStudentSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15).optional(),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  category: z.string().optional(),
  religion: z.string().optional(),
  caste: z.string().optional(),
  status: z.enum(["active", "inactive", "transferred", "left"]).optional(),
});

export const StudentResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  admissionNumber: z.string(),
  firstName: z.string(),
  lastName: z.string().nullable(),
  dateOfBirth: z.date(),
  gender: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  bloodGroup: z.string().nullable(),
  category: z.string().nullable(),
  religion: z.string().nullable(),
  caste: z.string().nullable(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Guardian schemas
export const CreateGuardianSchema = z.object({
  schoolId: z.string().uuid(),
  userId: z.string().uuid().optional(), // Can be linked to existing user or new
  name: z.string().min(1).max(200),
  phone: z.string().min(10).max(15),
  email: z.string().email().optional(),
  occupation: z.string().optional(),
  address: z.string().optional(),
  relationship: z.string().min(1).max(50),
  isPrimary: z.boolean().default(false),
  canPay: z.boolean().default(true),
  actorId: z.string(),
});

export const UpdateGuardianSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().min(10).max(15).optional(),
  email: z.string().email().optional(),
  occupation: z.string().optional(),
  address: z.string().optional(),
  relationship: z.string().min(1).max(50).optional(),
  isPrimary: z.boolean().optional(),
  canPay: z.boolean().optional(),
});

export const GuardianResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  userId: z.string().nullable(),
  name: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  occupation: z.string().nullable(),
  address: z.string().nullable(),
  relationship: z.string(),
  isPrimary: z.boolean(),
  canPay: z.boolean(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Enrollment schemas
export const CreateEnrollmentSchema = z.object({
  schoolId: z.string().uuid(),
  studentId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  classId: z.string().uuid(),
  sectionId: z.string().uuid(),
  rollNumber: z.string().min(1).max(50),
  status: z.enum(["active", "transferred", "left", "dropped"]).default("active"),
  actorId: z.string(),
});

export const UpdateEnrollmentSchema = z.object({
  rollNumber: z.string().min(1).max(50).optional(),
  status: z.enum(["active", "transferred", "left", "dropped"]).optional(),
});

export const EnrollmentResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  studentId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  classId: z.string().uuid(),
  sectionId: z.string().uuid(),
  rollNumber: z.string(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Student Document schemas
export const CreateStudentDocumentSchema = z.object({
  schoolId: z.string().uuid(),
  studentId: z.string().uuid(),
  documentType: z.string().min(1).max(100),
  objectPath: z.string().min(1),
  verifiedAt: z.string().datetime().optional(),
  actorId: z.string(),
});

export const StudentDocumentResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  studentId: z.string().uuid(),
  documentType: z.string(),
  objectPath: z.string(),
  verifiedAt: z.date().nullable(),
  createdAt: z.date(),
});

// Student Consent schemas
export const CreateStudentConsentSchema = z.object({
  schoolId: z.string().uuid(),
  studentId: z.string().uuid(),
  guardianId: z.string().uuid(),
  purpose: z.string().min(1).max(200),
  grantedAt: z.string().datetime(),
  withdrawnAt: z.string().datetime().optional(),
});

export const StudentConsentResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  studentId: z.string().uuid(),
  guardianId: z.string().uuid(),
  purpose: z.string(),
  grantedAt: z.date(),
  withdrawnAt: z.date().nullable(),
  status: z.string(),
});

// Search schemas
export const StudentSearchSchema = z.object({
  query: z.string().min(1),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  status: z.string().optional(),
  admissionNumber: z.string().optional(),
});

// Filter schemas
export const StudentFilterSchema = z.object({
  status: z.string().optional(),
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
  gender: z.string().optional(),
  dateOfBirthFrom: z.string().datetime().optional(),
  dateOfBirthTo: z.string().datetime().optional(),
});
