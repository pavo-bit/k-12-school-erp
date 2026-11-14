import { pgTable, text, timestamp, uuid, bigint, unique } from "drizzle-orm/pg-core";

export const documentSequences = pgTable(
  "document_sequences",
  {
    id: uuid("id").primaryKey(),
    schoolId: uuid("school_id").notNull(),
    documentType: text("document_type").notNull(),
    financialYear: text("financial_year").notNull(),
    nextValue: bigint("next_value", { mode: "number" }).notNull().default(1),
    prefix: text("prefix").notNull().default(""),
    padding: text("padding").notNull().default("6"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueSchoolTypeYear: unique().on(t.schoolId, t.documentType, t.financialYear),
  }),
);
