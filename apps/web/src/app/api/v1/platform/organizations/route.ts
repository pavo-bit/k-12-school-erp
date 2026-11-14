import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { createOrganization } from "@school-erp/platform";
import { CreateOrganizationSchema } from "@school-erp/platform";
import { z } from "zod";

export async function POST(request: Request) {
  return withApi(request, async (ctx) => {
    const body = await request.json().catch(() => null);
    const parsed = CreateOrganizationSchema.safeParse(body);
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
    const org = await createOrganization({
      name: parsed.data.name,
      billingEmail: parsed.data.billingEmail,
      actorId: ctx.userId,
    });
    return NextResponse.json(
      { data: org, meta: { request_id: crypto.randomUUID() } },
      { status: 201 },
    );
  });
}
