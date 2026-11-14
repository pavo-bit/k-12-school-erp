import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { inviteStaff, InviteStaffSchema } from "@school-erp/platform";

export async function POST(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId) {
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    }
    const body = await request.json().catch(() => null);
    const parsed = InviteStaffSchema.safeParse(body);
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
    const invitation = await inviteStaff({
      schoolId: ctx.schoolId,
      email: parsed.data.email,
      roleId: parsed.data.roleId,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: invitation, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
