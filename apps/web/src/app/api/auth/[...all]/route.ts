import { createAuth, toNextJsHandler } from "@school-erp/auth";
import { db } from "@school-erp/db";

const auth = createAuth(db, process.env.BETTER_AUTH_URL ?? "http://localhost:3000");

export const { GET, POST } = toNextJsHandler(auth as Parameters<typeof toNextJsHandler>[0]);
