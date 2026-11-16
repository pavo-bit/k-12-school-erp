import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createApplication, listApplications, updateApplication } from "@school-erp/admissions";
import { z } from "zod";

const CreateApplicationSchema = z.object({
  enquiryId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const url = new URL(request.url);
    const academicYearId = url.searchParams.get("academicYearId") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const applications = await listApplications(ctx.schoolId, academicYearId, status);
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
      status: parsed.data.status,
      notes: parsed.data.notes,
      actorId: ctx.userId,
    } as any);
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
    const parsed = z.object({
      id: z.string().uuid(),
      status: z.string().optional(),
      notes: z.string().optional(),
    }).safeParse(body);
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
    const application = await updateApplication(
      parsed.data.id,
      { status: parsed.data.status, notes: parsed.data.notes },
      ctx.userId,
    );
    return NextResponse.json({ data: application, meta: { request_id: crypto.randomUUID() } });
  });
}
