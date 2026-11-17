import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import {
  listApplications,
  createApplication,
  updateApplicationStatus,
} from "@school-erp/admissions";
import { z } from "zod";

const CreateApplicationSchema = z.object({
  enquiryId: z.string().uuid().optional(),
  academicYearId: z.string().uuid(),
});

const UpdateStatusSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(["submitted", "under_review", "accepted", "rejected", "converted"]),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? undefined;
    const applications = await listApplications(ctx.schoolId, status);
    return NextResponse.json({ data: applications, meta: { request_id: crypto.randomUUID() } });
  });
}

export async function POST(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const body = await request.json().catch(() => null);
    const parsed = CreateApplicationSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input.",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      );
    const application = await createApplication({
      schoolId: ctx.schoolId,
      enquiryId: parsed.data.enquiryId,
      academicYearId: parsed.data.academicYearId,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: application, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}

export async function PATCH(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const body = await request.json().catch(() => null);
    const parsed = UpdateStatusSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input.",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      );
    const application = await updateApplicationStatus(
      ctx.schoolId,
      parsed.data.applicationId,
      parsed.data.status,
      ctx.userId,
    );
    return NextResponse.json({ data: application, meta: { request_id: crypto.randomUUID() } });
  });
}
