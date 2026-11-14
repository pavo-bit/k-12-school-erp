import { z } from "zod";

export const CreateOrganizationSchema = z.object({
  name: z.string().min(2).max(120),
  billingEmail: z.string().email().optional(),
});

export const CreateSchoolSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  board: z.string().max(40).optional(),
  timezone: z.string().default("Asia/Kolkata"),
  locale: z.string().default("en"),
});

export const InviteStaffSchema = z.object({
  email: z.string().email(),
  roleId: z.string().uuid(),
});
