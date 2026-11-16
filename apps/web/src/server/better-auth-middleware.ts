import { NextResponse } from "next/server";
import { createAuth } from "@school-erp/auth";
import { db } from "@school-erp/db";
import { getCookie } from "./dev-auth";
import { resolveSchoolId } from "./tenant";

export interface BetterAuthContext {
  userId: string;
  schoolId: string | null;
  role: string | null;
  session: unknown;
}

export async function withBetterAuth(
  request: Request,
  handler: (ctx: BetterAuthContext) => Promise<Response>,
): Promise<Response> {
  const auth = createAuth(db, process.env.BETTER_AUTH_URL ?? "http://localhost:3000") as {
    api: {
      getSession: (opts: { headers: Headers }) => Promise<{
        user: { id: string; email: string; name: string };
        session: { id: string; expiresAt: Date };
      } | null>;
    };
  };

  let session = null;
  try {
    session = await auth.api.getSession({ headers: request.headers as unknown as Headers });
  } catch {
    // Fall through to unauthenticated
  }

  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Login required." } },
      { status: 401 },
    );
  }

  const schoolId = await resolveSchoolId(request).catch(() => null);

  const ctx: BetterAuthContext = {
    userId: session.user.id,
    schoolId,
    role: null,
    session,
  };

  try {
    return await handler(ctx);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Unexpected error." } },
      { status: 500 },
    );
  }
}
