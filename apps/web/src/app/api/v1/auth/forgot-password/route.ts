import { NextResponse } from "next/server";
import { startPasswordReset } from "@/server/reset-tokens";
import { z } from "zod";

const ForgotSchema = z.object({
  email: z.string().email().max(320),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = ForgotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "A valid email address is required." } },
        { status: 400 },
      );
    }
    await startPasswordReset(parsed.data.email);
  } catch (error) {
    // The response is identical whether the email exists or not — never leak failures.
    console.error("forgot-password error", error);
  }
  // Always 200 with the same payload.
  return NextResponse.json({
    data: { sent: true },
    meta: { request_id: crypto.randomUUID() },
  });
}
