import { NextResponse } from "next/server";
import { verifyPassword, createSession, setSessionCookie } from "@/server/dev-auth";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Invalid JSON body." } },
      { status: 400 },
    );
  }

  const email = body.email?.trim();
  const password = body.password;
  if (!email || !password) {
    return NextResponse.json(
      { error: { code: "MISSING_FIELDS", message: "Email and password are required." } },
      { status: 400 },
    );
  }

  const userId = await verifyPassword(email, password);
  if (!userId) {
    return NextResponse.json(
      { error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } },
      { status: 401 },
    );
  }

  const token = await createSession(userId);
  const response = NextResponse.json({
    data: { userId },
    meta: { request_id: crypto.randomUUID() },
  });
  setSessionCookie(response, token);
  return response;
}
