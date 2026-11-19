import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import {
  db,
  guardians,
  studentGuardians,
  staff,
} from "@school-erp/db";
import { withApi, type ApiContext } from "@/server/with-api";

export type MobileRole = "parent" | "teacher";
export type MobileApiContext = Omit<ApiContext, "schoolId"> & {
  schoolId: string;
  identityId: string;
};

type MobileHandler = (ctx: MobileApiContext) => Promise<Response>;

/**
 * Mobile endpoints require a live guardian or staff relationship in the
 * resolved school. This is independent of client-side navigation or role
 * labels and prevents a user from choosing an arbitrary school identifier.
 */
export async function withMobileApi(
  request: Request,
  role: MobileRole,
  handler: MobileHandler,
): Promise<Response> {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId) {
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    }

    if (role === "parent") {
      const rows = await db
        .select({ identityId: guardians.id })
        .from(studentGuardians)
        .innerJoin(guardians, eq(guardians.id, studentGuardians.guardianId))
        .where(
          and(
            eq(studentGuardians.schoolId, ctx.schoolId),
            eq(studentGuardians.status, "active"),
            eq(guardians.userId, ctx.userId),
          ),
        )
        .limit(1);

      if (!rows[0]) {
        return NextResponse.json(
          { error: { code: "PARENT_ACCESS_REQUIRED", message: "No active parent link exists for this school." } },
          { status: 403 },
        );
      }

      return handler({ ...ctx, schoolId: ctx.schoolId, identityId: rows[0].identityId });
    }

    const rows = await db
      .select({ identityId: staff.id })
      .from(staff)
      .where(
        and(
          eq(staff.schoolId, ctx.schoolId),
          eq(staff.userId, ctx.userId),
          eq(staff.status, "active"),
        ),
      )
      .limit(1);

    if (!rows[0]) {
      return NextResponse.json(
        { error: { code: "TEACHER_ACCESS_REQUIRED", message: "No active staff profile exists for this school." } },
        { status: 403 },
      );
    }

    return handler({ ...ctx, schoolId: ctx.schoolId, identityId: rows[0].identityId });
  });
}

export async function withParentChildApi(
  request: Request,
  studentId: string,
  handler: MobileHandler,
): Promise<Response> {
  return withMobileApi(request, "parent", async (ctx) => {
    const links = await db
      .select({ studentId: studentGuardians.studentId })
      .from(studentGuardians)
      .innerJoin(guardians, eq(guardians.id, studentGuardians.guardianId))
      .where(
        and(
          eq(studentGuardians.schoolId, ctx.schoolId),
          eq(studentGuardians.studentId, studentId),
          eq(studentGuardians.status, "active"),
          eq(guardians.userId, ctx.userId),
        ),
      )
      .limit(1);

    if (!links[0]) {
      return NextResponse.json(
        { error: { code: "CHILD_NOT_LINKED", message: "This student is not linked to your parent account." } },
        { status: 404 },
      );
    }

    return handler(ctx);
  });
}
