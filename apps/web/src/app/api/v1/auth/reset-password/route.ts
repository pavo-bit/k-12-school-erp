import { NextResponse } from "next/server";
import { completePasswordReset } from "@/server/reset-tokens";
import { z } from "zod";

const ResetSchema = z.object({
  token: z.string().min(32).max(200),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ResetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Token and a password of at least 8 characters are required.",
        },
      },
      { status: 400 },
    );
  }
  const result = await completePasswordReset(parsed.data.token, parsed.data.password);
  if (!result.ok) {
    const status = result.code === "INVALID_TOKEN" ? 400 : 422;
    const message =
      result.code === "INVALID_TOKEN"
        ? "This reset link is invalid or has expired."
        : "Password must be at least 8 characters.";
    return NextResponse.json({ error: { code: result.code, message } }, { status });
  }
  return NextResponse.json({ data: { reset: true }, meta: { request_id: crypto.randomUUID() } });
}
