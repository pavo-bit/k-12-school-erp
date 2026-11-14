import { z } from "zod";

export const CreateStudentSchema = z.object({
  admissionNumber: z.string().min(1).max(40),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(["male", "female", "other"]),
});

export const CreateGuardianSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().min(10).max(15),
  email: z.string().email().optional(),
  occupation: z.string().max(80).optional(),
});

export const LinkGuardianSchema = z.object({
  studentId: z.string().uuid(),
  guardianId: z.string().uuid(),
  relationship: z.string().min(1).max(40),
  isPrimary: z.boolean().default(false),
});

export const CreateEnrollmentSchema = z.object({
  studentId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  classId: z.string().uuid(),
  sectionId: z.string().uuid(),
  rollNumber: z.string().max(20).optional(),
});
