import { NextResponse } from "next/server";
import { runWithTenant } from "@school-erp/db";
import { getCookie, getSession } from "./dev-auth";
import { resolveSchoolId } from "./tenant";
import { createAuth } from "@school-erp/auth";
import { authDb } from "./auth-db";
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
  // Resolve the caller. Better Auth session wins when present; otherwise dev-auth.
  // Auth lookups use the pooled owner connection (pre request-scope) â€” in production
  // Better Auth must run on a BYPASSRLS-capable role; tenant-scoped tables are not
  // reachable under per-user RLS for login lookups.
  let userId: string | null = null;
  let role: string | null = null;

  try {
    const auth = createAuth(authDb, process.env.BETTER_AUTH_URL ?? "http://localhost:3000") as {
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
      userId = betterSession.user.id;
    }
  } catch {
    // Better Auth unavailable/misconfigured â€” fall back to dev-auth below.
  }

  if (!userId) {
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
    userId = session.user.id;
    role = session.role?.key ?? null;
  }

  const schoolId = await resolveSchoolId(request).catch(() => null);
  const ctx: ApiContext = { userId, schoolId, role };

  // The entire handler runs inside one tenant-scoped transaction:
  //   - every service query uses the scoped connection (AsyncLocalStorage)
  //   - RLS GUCs (app.current_school_id, app.current_user_id, ...) are set
  //   - success â†’ commit, exception â†’ rollback (no partial writes)
  try {
    return await runWithTenant(
      { schoolId, userId, isPlatformAdmin: role === "platform_admin" },
      () => handler(ctx),
    );
  } catch (error) {
    // Handler threw â†’ transaction already rolled back by runWithTenant.
    const normalized = normalizeError(error);
    console.error(error);
    return NextResponse.json(
      { error: { code: normalized.code, message: normalized.message } },
      { status: normalized.status },
    );
  }
}
