import { authDb as db } from "./auth-db";
import { schools } from "@school-erp/db";
import { eq } from "drizzle-orm";

export function resolveSchoolSlug(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0] ?? "";
  const subdomain = hostname.split(".")[0] ?? "";
  if (subdomain && subdomain !== "localhost" && subdomain !== "127") {
    return subdomain;
  }
  const fromQuery = url.searchParams.get("school");
  if (fromQuery) return fromQuery;
  return "greenwood";
}

export async function resolveSchoolId(request: Request): Promise<string | null> {
  const slug = resolveSchoolSlug(request);
  const rows = await db
    .select({ id: schools.id })
    .from(schools)
    .where(eq(schools.slug, slug))
    .limit(1);
  return rows[0]?.id ?? null;
}
