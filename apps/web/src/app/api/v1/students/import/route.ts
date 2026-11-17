import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { importStudents } from "@school-erp/sis";
import { z } from "zod";

const ImportSchema = z.object({
  csv: z.string().min(1),
  dryRun: z.boolean().default(true),
});

export async function POST(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const body = await request.json().catch(() => null);
    const parsed = ImportSchema.safeParse(body);
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
    const result = await importStudents(
      ctx.schoolId,
      parsed.data.csv,
      ctx.userId,
      parsed.data.dryRun,
    );
    return NextResponse.json({ data: result, meta: { request_id: crypto.randomUUID() } });
  });
}
