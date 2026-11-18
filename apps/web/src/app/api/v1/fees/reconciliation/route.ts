import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { db, invoices, payments } from "@school-erp/db";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { z } from "zod";

const ReconciliationQuerySchema = z.object({
  academicYearId: z.string().uuid().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

export async function GET(request: Request) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId) {
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    }

    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    const parsed = ReconciliationQuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    const { academicYearId, fromDate, toDate } = parsed.data;

    // Get all invoices
    const invoiceConditions = [eq(invoices.schoolId, ctx.schoolId)];
    if (academicYearId) invoiceConditions.push(eq(invoices.academicYearId, academicYearId));
    if (fromDate) invoiceConditions.push(gte(invoices.issueDate, fromDate));
    if (toDate) invoiceConditions.push(lte(invoices.issueDate, toDate));

    const allInvoices = await db
      .select()
      .from(invoices)
      .where(and(...invoiceConditions));

    // Get all payments
    const paymentConditions = [eq(payments.schoolId, ctx.schoolId)];
    if (fromDate) paymentConditions.push(gte(payments.receivedAt, new Date(fromDate)));
    if (toDate) paymentConditions.push(lte(payments.receivedAt, new Date(toDate)));

    const allPayments = await db
      .select()
      .from(payments)
      .where(and(...paymentConditions));

    // Calculate totals
    const totalDemand = allInvoices.reduce((sum, inv) => sum + (inv.totalPaise ?? 0), 0);
    const totalPaid = allPayments.reduce((sum, p) => sum + (p.amountPaise ?? 0), 0);
    const totalPending = totalDemand - totalPaid;

    // Aging analysis
    const now = new Date();
    const aging = {
      current: 0, // 0-30 days
      days30: 0, // 31-60 days
      days60: 0, // 61-90 days
      days90Plus: 0, // 90+ days
    };

    for (const inv of allInvoices) {
      if (inv.status === "paid") continue;
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : now;
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
      const pending = (inv.totalPaise ?? 0) - (inv.paidPaise ?? 0);

      if (daysOverdue <= 30) aging.current += pending;
      else if (daysOverdue <= 60) aging.days30 += pending;
      else if (daysOverdue <= 90) aging.days60 += pending;
      else aging.days90Plus += pending;
    }

    // Invoice status breakdown
    const statusBreakdown = allInvoices.reduce(
      (acc, inv) => {
        acc[inv.status ?? "unknown"] = (acc[inv.status ?? "unknown"] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Payment mode breakdown
    const modeBreakdown = allPayments.reduce(
      (acc, p) => {
        acc[p.mode ?? "unknown"] = (acc[p.mode ?? "unknown"] ?? 0) + (p.amountPaise ?? 0);
        return acc;
      },
      {} as Record<string, number>,
    );

    return NextResponse.json({
      data: {
        summary: {
          totalDemand,
          totalPaid,
          totalPending,
          collectionRate: totalDemand > 0 ? (totalPaid / totalDemand) * 100 : 0,
          invoiceCount: allInvoices.length,
          paymentCount: allPayments.length,
        },
        aging,
        statusBreakdown,
        modeBreakdown,
      },
      meta: { request_id: crypto.randomUUID() },
    });
  });
}
