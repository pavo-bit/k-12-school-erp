import { z } from "zod";

// Enquiry schemas
export const CreateEnquirySchema = z.object({
  schoolId: z.string().uuid(),
  studentName: z.string().min(1).max(200),
  guardianPhone: z.string().min(10).max(15),
  classSought: z.string().min(1).max(50),
  source: z.enum(["website", "walk_in", "referral", "advertisement", "other"]).default("other"),
  status: z.enum(["new", "contacted", "scheduled", "converted", "rejected", "closed"]).default("new"),
  actorId: z.string(),
});

export const UpdateEnquirySchema = z.object({
  studentName: z.string().min(1).max(200).optional(),
  guardianPhone: z.string().min(10).max(15).optional(),
  classSought: z.string().min(1).max(50).optional(),
  status: z.enum(["new", "contacted", "scheduled", "converted", "rejected", "closed"]).optional(),
  notes: z.string().max(1000).optional(),
});

export const EnquiryResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  studentName: z.string(),
  guardianPhone: z.string(),
  classSought: z.string(),
  source: z.string(),
  status: z.string(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Application schemas
export const CreateApplicationSchema = z.object({
  schoolId: z.string().uuid(),
  enquiryId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  status: z.enum(["draft", "submitted", "review", "interview", "selected", "rejected", "converted", "withdrawn"]).default("draft"),
  actorId: z.string(),
});

export const UpdateApplicationSchema = z.object({
  status: z.enum(["draft", "submitted", "review", "interview", "selected", "rejected", "converted", "withdrawn"]).optional(),
  notes: z.string().max(1000).optional(),
});

export const ApplicationResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  enquiryId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  status: z.string(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Application Document schemas
export const CreateApplicationDocumentSchema = z.object({
  schoolId: z.string().uuid(),
  applicationId: z.string().uuid(),
  documentType: z.string().min(1).max(100),
  objectPath: z.string().min(1),
  verifiedAt: z.string().datetime().optional(),
  actorId: z.string(),
});

export const ApplicationDocumentResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  applicationId: z.string().uuid(),
  documentType: z.string(),
  objectPath: z.string(),
  verifiedAt: z.date().nullable(),
  createdAt: z.date(),
});

// Application Note schemas
export const CreateApplicationNoteSchema = z.object({
  schoolId: z.string().uuid(),
  applicationId: z.string().uuid(),
  note: z.string().min(1).max(1000),
  actorId: z.string(),
});

export const ApplicationNoteResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  applicationId: z.string().uuid(),
  note: z.string(),
  actorId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Conversion schemas
export const CreateConversionSchema = z.object({
  schoolId: z.string().uuid(),
  applicationId: z.string().uuid(),
  convertedStudentId: z.string().uuid(),
  convertedAt: z.string().datetime(),
  actorId: z.string(),
});

export const ConversionResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  applicationId: z.string().uuid(),
  convertedStudentId: z.string().uuid(),
  convertedAt: z.date(),
  createdAt: z.date(),
});

// Admission Status History schemas
export const CreateAdmissionStatusHistorySchema = z.object({
  schoolId: z.string().uuid(),
  applicationId: z.string().uuid(),
  status: z.string(),
  actorId: z.string(),
  notes: z.string().max(1000).optional(),
});

export const AdmissionStatusHistoryResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  applicationId: z.string().uuid(),
  status: z.string(),
  actorId: z.string(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Search schemas
export const EnquirySearchSchema = z.object({
  query: z.string().min(1),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  status: z.string().optional(),
  classSought: z.string().optional(),
});

// Filter schemas
export const EnquiryFilterSchema = z.object({
  status: z.string().optional(),
  source: z.string().optional(),
  classSought: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});
