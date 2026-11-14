import { NextResponse } from "next/server";
import { getCookie, getSession } from "@/server/dev-auth";
import { resolveSchoolId } from "@/server/tenant";

export async function GET(request: Request) {
  const token = getCookie(request, "session_token");
  if (!token) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Login required." } },
      { status: 401 },
    );
  }
  const ctx = await getSession(token);
  if (!ctx) {
    return NextResponse.json(
      { error: { code: "SESSION_EXPIRED", message: "Session expired." } },
      { status: 401 },
    );
  }
  const schoolId = await resolveSchoolId(request);
  return NextResponse.json({
    data: {
      user: { id: ctx.user.id, name: ctx.user.name, email: ctx.user.email },
      role: ctx.role?.key ?? null,
      schoolId,
    },
    meta: { request_id: crypto.randomUUID() },
  });
}
