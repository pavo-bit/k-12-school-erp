import argon2 from "argon2";
import { users, accounts, sessions, memberships, roles } from "@school-erp/db";
import { authDb as db } from "./auth-db";
import { eq, and } from "drizzle-orm";

export async function verifyPassword(email: string, password: string): Promise<string | null> {
  const userRows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = userRows[0];
  if (!user) return null;

  const accountRows = await db.select().from(accounts).where(eq(accounts.userId, user.id)).limit(1);
  const account = accountRows[0];
  if (!account?.password) return null;

  const ok = await argon2.verify(account.password, password);
  return ok ? user.id : null;
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomUUID() + crypto.randomUUID();
  await db.insert(sessions).values({
    id: crypto.randomUUID(),
    userId,
    token,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  });
  return token;
}

export async function getSession(token: string) {
  const rows = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
  const session = rows[0];
  if (!session || session.expiresAt < new Date()) return null;

  const userRows = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  const user = userRows[0];
  if (!user) return null;

  const membershipRows = await db
    .select({ membership: memberships, role: roles })
    .from(memberships)
    .innerJoin(roles, eq(memberships.roleId, roles.id))
    .where(and(eq(memberships.userId, user.id), eq(memberships.status, "active")))
    .limit(1);

  const membership = membershipRows[0];
  return {
    session,
    user,
    membership: membership?.membership ?? null,
    role: membership?.role ?? null,
  };
}

export async function deleteSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export function setSessionCookie(response: Response, token: string): void {
  response.headers.set(
    "Set-Cookie",
    `session_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
  );
}

export function clearSessionCookie(response: Response): void {
  response.headers.set("Set-Cookie", "session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
}

export function getCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  const match = cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}
