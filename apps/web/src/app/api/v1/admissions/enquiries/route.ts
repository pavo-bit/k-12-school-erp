import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { listEnquiries, createEnquiry } from "@school-erp/admissions";
import { z } from "zod";

const CreateEnquirySchema = z.object({
  studentName: z.string().min(1).max(120),
  guardianPhone: z.string().min(10).max(15),
  classSought: z.string().min(1).max(40),
  source: z.string().min(1).max(40),
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
    const enquiries = await listEnquiries(ctx.schoolId, status);
    return NextResponse.json({ data: enquiries, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreateEnquirySchema.safeParse(body);
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
    const enquiry = await createEnquiry({
      schoolId: ctx.schoolId,
      studentName: parsed.data.studentName,
      guardianPhone: parsed.data.guardianPhone,
      classSought: parsed.data.classSought,
      source: parsed.data.source,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: enquiry, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
