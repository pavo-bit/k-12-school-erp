import { db, students } from "@school-erp/db";
import { eq, and } from "drizzle-orm";
import { createStudent } from "./sis-service";
import { randomUUID } from "node:crypto";

export interface ImportResult {
  total: number;
  imported: number;
  failed: number;
  errors: { row: number; admissionNumber?: string; error: string }[];
}

/**
 * Import students from CSV text.
 * CSV columns: admission_number,first_name,last_name,date_of_birth,gender
 * date_of_birth must be YYYY-MM-DD.
 * When dryRun is true, rows are validated but not inserted.
 */
export async function importStudents(
  schoolId: string,
  csv: string,
  actorId: string,
  dryRun = false,
): Promise<ImportResult> {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { total: 0, imported: 0, failed: 0, errors: [] };
  }

  const headerLine = lines[0];
  if (!headerLine) {
    return { total: 0, imported: 0, failed: 0, errors: [] };
  }
  const header = headerLine.trim().toLowerCase();
  const cols = header.split(",").map((c) => c.trim());
  const idx = {
    admission_number: cols.indexOf("admission_number"),
    first_name: cols.indexOf("first_name"),
    last_name: cols.indexOf("last_name"),
    date_of_birth: cols.indexOf("date_of_birth"),
    gender: cols.indexOf("gender"),
  };
  if (idx.admission_number < 0 || idx.first_name < 0 || idx.date_of_birth < 0) {
    return {
      total: 0,
      imported: 0,
      failed: 0,
      errors: [
        { row: 0, error: "CSV must include admission_number, first_name, date_of_birth columns" },
      ],
    };
  }

  const errors: ImportResult["errors"] = [];
  let imported = 0;

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1;
    const line = lines[i];
    if (!line) continue;
    const cells = line.split(",").map((c) => c.trim());
    const admissionNumber = cells[idx.admission_number] ?? "";
    const firstName = cells[idx.first_name] ?? "";
    const lastName = idx.last_name >= 0 ? (cells[idx.last_name] ?? "") : "";
    const dob = idx.date_of_birth >= 0 ? (cells[idx.date_of_birth] ?? "") : "";
    const gender = idx.gender >= 0 ? (cells[idx.gender] ?? "other").toLowerCase() : "other";

    if (!admissionNumber || !firstName || !dob) {
      errors.push({
        row: rowNum,
        admissionNumber,
        error: "Missing required field (admission_number, first_name, date_of_birth)",
      });
      continue;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      errors.push({ row: rowNum, admissionNumber, error: "date_of_birth must be YYYY-MM-DD" });
      continue;
    }
    if (!["male", "female", "other", "prefer_not_to_say"].includes(gender)) {
      errors.push({ row: rowNum, admissionNumber, error: `Invalid gender "${gender}"` });
      continue;
    }

    if (dryRun) {
      imported += 1;
      continue;
    }

    try {
      await createStudent({
        schoolId,
        admissionNumber,
        firstName,
        lastName,
        dateOfBirth: dob,
        gender,
        actorId,
      });
      imported += 1;
    } catch (err) {
      errors.push({
        row: rowNum,
        admissionNumber,
        error: err instanceof Error ? err.message : "Insert failed",
      });
    }
  }

  return { total: lines.length - 1, imported, failed: errors.length, errors };
}

/**
 * Export students as CSV.
 */
export async function exportStudentsCsv(schoolId: string): Promise<string> {
  const rows = await db
    .select({
      admissionNumber: students.admissionNumber,
      firstName: students.firstName,
      lastName: students.lastName,
      dateOfBirth: students.dateOfBirth,
      gender: students.gender,
      status: students.status,
    })
    .from(students)
    .where(eq(students.schoolId, schoolId));

  const header = "admission_number,first_name,last_name,date_of_birth,gender,status";
  const body = rows.map((r) =>
    [r.admissionNumber, r.firstName, r.lastName, r.dateOfBirth, r.gender, r.status].join(","),
  );
  return [header, ...body].join("\n");
}
