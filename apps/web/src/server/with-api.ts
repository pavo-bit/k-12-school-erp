import { NextResponse } from "next/server";
import { getCookie, getSession } from "./dev-auth";
import { resolveSchoolId } from "./tenant";

export interface ApiContext {
  userId: string;
  schoolId: string | null;
  role: string | null;
}

export async function withApi(
  request: Request,
  handler: (ctx: ApiContext) => Promise<Response>,
): Promise<Response> {
  const token = getCookie(request, "session_token");
  if (!token) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Login required." } },
      { status: 401 },
    );
  }
  const session = await getSession(token);
  if (!session) {
    return NextResponse.json(
      { error: { code: "SESSION_EXPIRED", message: "Session expired." } },
      { status: 401 },
    );
  }
  const schoolId = await resolveSchoolId(request);
  const role = session.role?.key ?? null;
  try {
    return await handler({ userId: session.user.id, schoolId, role });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Unexpected error." } },
      { status: 500 },
    );
  }
}
