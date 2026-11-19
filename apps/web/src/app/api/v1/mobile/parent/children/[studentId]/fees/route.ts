import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db, invoices, payments, receipts } from "@school-erp/db";
import { withParentChildApi } from "@/server/with-mobile-api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const { studentId } = await params;
  return withParentChildApi(request, studentId, async (ctx) => {
    const invoiceRows = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        academicYearId: invoices.academicYearId,
        financialYear: invoices.financialYear,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        status: invoices.status,
        totalPaise: invoices.totalPaise,
        paidPaise: invoices.paidPaise,
      })
      .from(invoices)
      .where(and(eq(invoices.schoolId, ctx.schoolId), eq(invoices.studentId, studentId)))
      .orderBy(desc(invoices.issueDate));

    const paymentRows = await db
      .select({
        id: payments.id,
        amountPaise: payments.amountPaise,
        mode: payments.mode,
        status: payments.status,
        receivedAt: payments.receivedAt,
        receiptId: receipts.id,
        receiptNumber: receipts.receiptNumber,
        receiptIssuedAt: receipts.issuedAt,
      })
      .from(payments)
      .leftJoin(receipts, eq(receipts.paymentId, payments.id))
      .where(and(eq(payments.schoolId, ctx.schoolId), eq(payments.studentId, studentId)))
      .orderBy(desc(payments.receivedAt));

    return NextResponse.json({
      data: {
        invoices: invoiceRows.map((invoice) => ({
          ...invoice,
          outstandingPaise: Math.max(0, invoice.totalPaise - invoice.paidPaise),
        })),
        payments: paymentRows,
      },
      meta: { request_id: crypto.randomUUID() },
    });
  });
}
