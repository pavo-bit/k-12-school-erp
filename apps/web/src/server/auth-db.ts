import { db, createStandaloneDb } from "@school-erp/db";

/**
 * Connection used for authentication, session, and tenant-resolution queries.
 *
 * In production:
 *   DATABASE_URL      → erp_app   (RLS-enforcing; all tenant-scoped queries)
 *   AUTH_DATABASE_URL → erp_auth  (BYPASSRLS; login/session/slug-resolution)
 *
 * In development either variable may be unset; queries then run on the default
 * pooled owner connection (RLS-bypassed), matching historical behaviour.
 */
export const authDb = createStandaloneDb(process.env.AUTH_DATABASE_URL) ?? db;
