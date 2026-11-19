import { NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { announcements, db } from "@school-erp/db";
import { withMobileApi } from "@/server/with-mobile-api";

export async function GET(request: Request) {
  return withMobileApi(request, "parent", async (ctx) => {
    const rows = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        body: announcements.body,
        audience: announcements.audience,
        sentAt: announcements.sentAt,
        createdAt: announcements.createdAt,
      })
      .from(announcements)
      .where(
        and(
          eq(announcements.schoolId, ctx.schoolId),
          inArray(announcements.audience, ["all", "parents", "parent"]),
          inArray(announcements.status, ["sent", "published"]),
        ),
      )
      .orderBy(desc(announcements.sentAt), desc(announcements.createdAt))
      .limit(100);

    return NextResponse.json({
      data: rows,
      meta: { request_id: crypto.randomUUID() },
    });
  });
}
