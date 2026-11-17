import { describe, it, expect } from "vitest";
import { withClient, SUPERUSER_URL } from "./helpers.js";

/**
 * Financial ledger invariants.
 *
 * These run as the superuser/owner so they see the whole ledger regardless of tenant.
 * On a fresh, empty CI database they pass vacuously; on a seeded development database
 * (and on any restored production snapshot) they actively detect corruption.
 */
describe("financial invariants", () => {
  it("an invoice is never paid more than its total", async () => {
    await withClient(SUPERUSER_URL, async (client) => {
      const { rows } = await client.query(
        "select count(*)::int as n from invoices where paid_paise > total_paise",
      );
      expect(rows[0].n).toBe(0);
    });
  });

  it("invoice and payment amounts are never negative", async () => {
    await withClient(SUPERUSER_URL, async (client) => {
      const a = await client.query(
        "select count(*)::int as n from invoices where total_paise < 0 or paid_paise < 0",
      );
      const b = await client.query(
        "select count(*)::int as n from payments where amount_paise <= 0",
      );
      expect(a.rows[0].n).toBe(0);
      expect(b.rows[0].n).toBe(0);
    });
  });

  it("a payment is never allocated more than its amount", async () => {
    await withClient(SUPERUSER_URL, async (client) => {
      const { rows } = await client.query(
        `select count(*)::int as n from (
           select p.id
             from payments p
             join (
               select payment_id, sum(amount_paise) as allocated
                 from payment_allocations
                group by payment_id
             ) a on a.payment_id = p.id
            where a.allocated > p.amount_paise
         ) over_allocated`,
      );
      expect(rows[0].n).toBe(0);
    });
  });

  it("every money column is bigint or integer — never floating point", async () => {
    await withClient(SUPERUSER_URL, async (client) => {
      const { rows } = await client.query(
        `select table_name, column_name, data_type
           from information_schema.columns
          where table_schema = 'public'
            and column_name like '%paise'
            and data_type not in ('bigint', 'integer', 'smallint')
          order by table_name, column_name`,
      );
      expect(rows, `non-integer money columns: ${JSON.stringify(rows)}`).toEqual([]);
    });
  });

  it("invoice and receipt numbers follow the school-scoped sequence format", async () => {
    await withClient(SUPERUSER_URL, async (client) => {
      const a = await client.query(
        "select count(*)::int as n from invoices where invoice_number !~ '^INV-[0-9]{6}$'",
      );
      const b = await client.query(
        "select count(*)::int as n from receipts where receipt_number !~ '^RCP-[0-9]{6}$'",
      );
      expect(a.rows[0].n).toBe(0);
      expect(b.rows[0].n).toBe(0);
    });
  });

  it("invoice and receipt numbers are unique per school", async () => {
    await withClient(SUPERUSER_URL, async (client) => {
      const a = await client.query(
        `select count(*)::int as n from (
           select school_id, invoice_number from invoices group by school_id, invoice_number having count(*) > 1
         ) dup`,
      );
      const b = await client.query(
        `select count(*)::int as n from (
           select school_id, receipt_number from receipts group by school_id, receipt_number having count(*) > 1
         ) dup`,
      );
      expect(a.rows[0].n).toBe(0);
      expect(b.rows[0].n).toBe(0);
    });
  });

  it("paid invoices report exactly their paid portion as outstanding zero", async () => {
    await withClient(SUPERUSER_URL, async (client) => {
      const { rows } = await client.query(
        `select count(*)::int as n
           from invoices
          where status = 'paid' and paid_paise <> total_paise`,
      );
      expect(rows[0].n).toBe(0);
    });
  });
});
