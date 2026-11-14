import { NextResponse } from "next/server";
import { getCookie, deleteSession, clearSessionCookie } from "@/server/dev-auth";

export async function POST(request: Request) {
  const token = getCookie(request, "session_token");
  if (token) await deleteSession(token);
  const response = NextResponse.json({
    data: { ok: true },
    meta: { request_id: crypto.randomUUID() },
  });
  clearSessionCookie(response);
  return response;
}
