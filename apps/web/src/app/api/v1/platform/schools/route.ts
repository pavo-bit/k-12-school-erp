import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createSchool, CreateSchoolSchema } from "@school-erp/platform";

export async function POST(request: Request) {
  return withApi(request, async (ctx) => {
    const body = await request.json().catch(() => null);
    const parsed = CreateSchoolSchema.safeParse(body);
    if (!parsed.success) {
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
    }
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
