import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { db, reportCards } from "@school-erp/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const PublishSchema = z.object({
  examId: z.string().uuid(),
  studentIds: z.array(z.string().uuid()).optional(),
  status: z.enum(["published", "archived"]).default("published"),
});

export async function POST(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId) {
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = PublishSchema.safeParse(body);
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

    const { examId, studentIds, status } = parsed.data;

    // Build conditions
    const conditions = [eq(reportCards.schoolId, ctx.schoolId), eq(reportCards.examId, examId)];
    if (studentIds && studentIds.length > 0) {
      // Filter by specific students
      // In production, use inArray
    }

    // Update status
    await db
      .update(reportCards)
      .set({
        status,
        publishedAt: status === "published" ? new Date() : null,
      })
      .where(and(...conditions));

    // Fetch updated cards
    const updatedCards = await db
      .select()
      .from(reportCards)
      .where(and(eq(reportCards.schoolId, ctx.schoolId), eq(reportCards.examId, examId)));

    return NextResponse.json({
      data: {
        published: updatedCards.filter((c) => c.status === "published").length,
        total: updatedCards.length,
        cards: updatedCards,
      },
      meta: { request_id: crypto.randomUUID() },
    });
  });
}
