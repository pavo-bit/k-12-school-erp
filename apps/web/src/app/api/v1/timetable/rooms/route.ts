import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { listRooms, createRoom } from "@school-erp/timetable";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().min(1).max(80),
  capacity: z.number().int().positive().optional(),
  building: z.string().max(80).optional(),
  type: z.string().max(20).default("classroom"),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const rooms = await listRooms(ctx.schoolId);
    return NextResponse.json({ data: rooms, meta: { request_id: crypto.randomUUID() } });
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
    const parsed = CreateSchema.safeParse(body);
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
    const roomInput: Parameters<typeof createRoom>[0] = {
      schoolId: ctx.schoolId,
      name: parsed.data.name,
      actorId: ctx.userId,
    };
    if (parsed.data.capacity !== undefined) roomInput.capacity = parsed.data.capacity;
    if (parsed.data.building !== undefined) roomInput.building = parsed.data.building;
    roomInput.type = parsed.data.type;
    const room = await createRoom(roomInput);
    return NextResponse.json(
      { data: room, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
