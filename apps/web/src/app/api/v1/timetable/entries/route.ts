import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { setEntry, listEntries, deleteEntry, TimetableError } from "@school-erp/timetable";
import { z } from "zod";

const SetEntrySchema = z.object({
  sectionId: z.string().uuid(),
  dayOfWeek: z.number().int().min(1).max(6),
  periodId: z.string().uuid(),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid(),
  roomId: z.string().uuid().optional(),
  room: z.string().max(80).optional(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(400).optional(),
});

const CONFLICT_CODES = new Set([
  "SECTION_SLOT_TAKEN",
  "TEACHER_DOUBLE_BOOKED",
  "ROOM_DOUBLE_BOOKED",
]);

function mapTimetableError(err: unknown) {
  if (err instanceof TimetableError) {
    if (CONFLICT_CODES.has(err.code)) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: 409 },
      );
    }
    if (err.code === "NOT_FOUND" || err.code === "REFERENCE_NOT_FOUND") {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.code === "NOT_FOUND" ? 404 : 422 },
      );
    }
    if (err.code === "MISSING_PARAM") {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: 400 },
      );
    }
  }
  throw err;
}

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const url = new URL(request.url);
    const sectionId = url.searchParams.get("sectionId") ?? undefined;
    const teacherId = url.searchParams.get("teacherId") ?? undefined;
    try {
      const entries = await listEntries({
        schoolId: ctx.schoolId,
        ...(sectionId ? { sectionId } : {}),
        ...(teacherId ? { teacherId } : {}),
      });
      return NextResponse.json({ data: entries, meta: { request_id: crypto.randomUUID() } });
    } catch (err) {
      return mapTimetableError(err);
    }
  });
}

export async function POST(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const body = await request.json().catch(() => null);
    const parsed = SetEntrySchema.safeParse(body);
    if (!parsed.success)
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
    try {
      const entry = await setEntry({ schoolId: ctx.schoolId, ...parsed.data, actorId: ctx.userId });
      return NextResponse.json(
        { data: entry, meta: { request_id: crypto.randomUUID() } },
        { status: 201 },
      );
    } catch (err) {
      return mapTimetableError(err);
    }
  });
}

export async function DELETE(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id)
      return NextResponse.json(
        { error: { code: "MISSING_PARAM", message: "id is required." } },
        { status: 400 },
      );
    try {
      const result = await deleteEntry({ schoolId: ctx.schoolId, id, actorId: ctx.userId });
      return NextResponse.json({ data: result, meta: { request_id: crypto.randomUUID() } });
    } catch (err) {
      return mapTimetableError(err);
    }
  });
}
