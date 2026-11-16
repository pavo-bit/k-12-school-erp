import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createConversion, listConversions } from "@school-erp/admissions";
import { z } from "zod";

const CreateConversionSchema = z.object({
  applicationId: z.string().uuid(),
  convertedStudentId: z.string().uuid(),
  convertedAt: z.string().datetime(),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const url = new URL(request.url);
    const applicationId = url.searchParams.get("applicationId") ?? undefined;
    const conversions = await listConversions(ctx.schoolId, applicationId);
    return NextResponse.json({ data: conversions, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreateConversionSchema.safeParse(body);
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
    const conversion = await createConversion({
      schoolId: ctx.schoolId,
      applicationId: parsed.data.applicationId,
      convertedStudentId: parsed.data.convertedStudentId,
      convertedAt: new Date(parsed.data.convertedAt),
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: conversion, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
