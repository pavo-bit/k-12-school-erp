import { NextResponse } from "next/server";
import { getCookie, getSession } from "./dev-auth";
import { resolveSchoolId } from "./tenant";
import { createAuth } from "@school-erp/auth";
import { db } from "@school-erp/db";
import { normalizeError } from "./errors";

export interface ApiContext {
  userId: string;
  schoolId: string | null;
  role: string | null;
}

export async function withApi(
  request: Request,
  handler: (ctx: ApiContext) => Promise<Response>,
): Promise<Response> {
  // Try Better Auth session first
  try {
    const auth = createAuth(db, process.env.BETTER_AUTH_URL ?? "http://localhost:3000") as {
      api: {
        getSession: (opts: { headers: Headers }) => Promise<{
          user: { id: string; email: string; name: string };
          session: { id: string; expiresAt: Date };
        } | null>;
      };
    };

    const betterSession = await auth.api.getSession({
      headers: request.headers as unknown as Headers,
    });
    if (betterSession) {
      const schoolId = await resolveSchoolId(request).catch(() => null);
      try {
        return await handler({ userId: betterSession.user.id, schoolId, role: null });
      } catch (error) {
        const normalized = normalizeError(error);
        console.error(error);
        return NextResponse.json(
          { error: { code: normalized.code, message: normalized.message } },
          { status: normalized.status },
        );
      }
    }
  } catch {
    // Fall through to dev-auth
  }

  // Fall back to dev-auth session
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
    const normalized = normalizeError(error);
    console.error(error);
    return NextResponse.json(
      { error: { code: normalized.code, message: normalized.message } },
      { status: normalized.status },
    );
  }
}
