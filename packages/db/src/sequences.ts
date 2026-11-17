import { db } from "./client.js";
import { sql } from "drizzle-orm";

/** Indian financial year: April–March, formatted like "2026-27". */
export function getFinancialYear(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const start = month >= 4 ? year : year - 1;
  const end = (start + 1) % 100;
  return `${start}-${String(end).padStart(2, "0")}`;
}

const DOCUMENT_TYPES: Record<string, { documentType: string; prefix: string }> = {
  invoice: { documentType: "invoice", prefix: "INV" },
  receipt: { documentType: "receipt", prefix: "RCP" },
};

/**
 * Allocates the next gapless document number for a school + document type + financial year.
 *
 * Uses a single atomic upsert (INSERT ... ON CONFLICT DO UPDATE ... RETURNING), so
 * concurrent requests can never receive the same number — safe without explicit locking.
 * The gapless guarantee holds as long as callers only call this inside a transaction
 * that commits (the API use `withApi` → runWithTenant, which commits or rolls back).
 */
export async function nextDocumentNumber(
  schoolId: string,
  documentType: string,
  financialYear: string = getFinancialYear(new Date()),
): Promise<string> {
  const cfg = DOCUMENT_TYPES[documentType];
  if (!cfg) {
    throw new Error(
      `Unknown document type: "${documentType}". Known: ${Object.keys(DOCUMENT_TYPES).join(", ")}`,
    );
  }

  const result = await db.execute(sql`
    INSERT INTO document_sequences (id, school_id, document_type, financial_year, next_value, prefix, padding)
    VALUES (gen_random_uuid(), ${schoolId}, ${cfg.documentType}, ${financialYear}, 2, ${cfg.prefix}, '6')
    ON CONFLICT (school_id, document_type, financial_year)
    DO UPDATE SET next_value = document_sequences.next_value + 1, updated_at = now()
    RETURNING next_value, prefix, padding
  `);

  const row = (result.rows?.[0] ?? undefined) as
    { next_value: string | number; prefix: string; padding: string } | undefined;
  if (!row) {
    throw new Error("Failed to allocate document number.");
  }
  const used = Number(row.next_value) - 1;
  const pad = Number(row.padding) > 0 ? Number(row.padding) : 6;
  return `${row.prefix}-${String(used).padStart(pad, "0")}`;
}
