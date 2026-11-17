import { db, users, accounts, sessions, verifications } from "@school-erp/db";
import { sendConsoleEmail } from "@school-erp/communication";
import { eq, and, gt } from "drizzle-orm";
import argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";

const RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3200";
}

/**
 * Starts a password reset. ALWAYS behaves the same externally — whether the email
 * exists or not, the caller returns "sent". The token is only emailed when a user
 * exists, and is stored hashed (SHA-256) with a 30-minute TTL.
 */
export async function startPasswordReset(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const userRows = await db.select().from(users).where(eq(users.email, normalized)).limit(1);
  const user = userRows[0];
  if (!user) return; // do not leak existence

  const token = randomBytes(32).toString("hex");
  await db.insert(verifications).values({
    id: crypto.randomUUID(),
    identifier: normalized,
    value: hashToken(token),
    expiresAt: new Date(Date.now() + RESET_TTL_MS),
  });

  sendConsoleEmail(
    normalized,
    "Reset your School ERP password",
    `Hi ${user.name ?? normalized},\n\nUse this link to reset your password (valid for 30 minutes):\n\n${appUrl()}/reset-password?token=${token}\n\nIf you did not request this, ignore this email.`,
  );
}

/** Completes a password reset. Single-use, time-boxed, revokes all sessions on success. */
export async function completePasswordReset(
  token: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; code: "INVALID_TOKEN" | "PASSWORD_POLICY" }> {
  if (newPassword.length < 8) {
    return { ok: false, code: "PASSWORD_POLICY" };
  }

  const row = await db
    .select()
    .from(verifications)
    .where(and(eq(verifications.value, hashToken(token)), gt(verifications.expiresAt, new Date())))
    .limit(1);
  const record = row[0];
  if (!record) {
    return { ok: false, code: "INVALID_TOKEN" };
  }

  const userRows = await db.select().from(users).where(eq(users.email, record.identifier)).limit(1);
  const user = userRows[0];
  if (!user) {
    return { ok: false, code: "INVALID_TOKEN" };
  }

  const newHash = await argon2.hash(newPassword);
  const accountRows = await db.select().from(accounts).where(eq(accounts.userId, user.id)).limit(1);
  if (!accountRows[0]) {
    return { ok: false, code: "INVALID_TOKEN" };
  }

  await db
    .update(accounts)
    .set({ password: newHash, updatedAt: new Date() })
    .where(eq(accounts.userId, user.id));

  // Single-use token: remove it, and revoke every session so old tokens die too.
  await db.delete(verifications).where(eq(verifications.id, record.id));
  await db.delete(sessions).where(eq(sessions.userId, user.id));

  return { ok: true };
}
