import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createSchool, listSchools } from "@school-erp/platform";
import { z } from "zod";

const CreateSchoolSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  board: z.string().optional(),
  timezone: z.string().min(1).max(50),
  locale: z.string().min(1).max(10),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get("organizationId") ?? undefined;
    const schools = await listSchools(organizationId);
    return NextResponse.json({ data: schools, meta: { request_id: crypto.randomUUID() } });
  });
}

export async function POST(request: Request) {
  return withApi(request, async (ctx) => {
    const body = await request.json().catch(() => null);
    const parsed = CreateSchoolSchema.safeParse(body);
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
    const school = await createSchool({
      organizationId: parsed.data.organizationId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      board: parsed.data.board,
      timezone: parsed.data.timezone,
      locale: parsed.data.locale,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: school, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
