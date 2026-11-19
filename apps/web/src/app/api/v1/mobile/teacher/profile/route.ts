import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, staff, users } from "@school-erp/db";
import { withMobileApi } from "@/server/with-mobile-api";

export async function GET(request: Request) {
  return withMobileApi(request, "teacher", async (ctx) => {
    const rows = await db
      .select({
        staffId: staff.id,
        employeeCode: staff.employeeCode,
        designationId: staff.designationId,
        departmentId: staff.departmentId,
        joiningDate: staff.joiningDate,
        staffStatus: staff.status,
        userId: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
      })
      .from(staff)
      .innerJoin(users, eq(users.id, staff.userId))
      .where(
        and(
          eq(staff.id, ctx.identityId),
          eq(staff.schoolId, ctx.schoolId),
          eq(users.id, ctx.userId),
        ),
      )
      .limit(1);

    if (!rows[0]) {
      return NextResponse.json(
        { error: { code: "STAFF_PROFILE_NOT_FOUND", message: "Teacher profile was not found." } },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: rows[0],
      meta: { request_id: crypto.randomUUID() },
    });
  });
}
