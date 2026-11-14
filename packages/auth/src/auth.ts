import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins";
import argon2 from "argon2";
export function createAuth(db: unknown, baseURL: string): unknown {
  return betterAuth({
    database: drizzleAdapter(db as unknown as Parameters<typeof drizzleAdapter>[0], {
      provider: "pg",
      usePlural: true,
    }),
    baseURL,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      password: {
        hash: async (password: string) => argon2.hash(password),
        verify: async ({ hash, password }: { hash: string; password: string }) =>
          argon2.verify(hash, password),
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    trustedOrigins: [baseURL],
    plugins: [twoFactor()],
  }) as unknown;
}
