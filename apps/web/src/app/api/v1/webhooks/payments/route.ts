import { NextResponse } from "next/server";
import { db, payments, invoices } from "@school-erp/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const PaymentWebhookSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z.object({
      id: z.string(),
      entity: z.string(),
      amount: z.number(),
      currency: z.string(),
      status: z.string(),
      order_id: z.string().optional(),
      invoice_id: z.string().optional(),
      method: z.string().optional(),
      captured: z.boolean().optional(),
      created_at: z.number().optional(),
    }),
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = PaymentWebhookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid webhook payload" } },
        { status: 400 },
      );
    }

    const { event, payload } = parsed.data;
    const payment = payload.payment;

    // Handle payment captured event
    if (event === "payment.captured" && payment.captured) {
      // Update payment status
      await db
        .update(payments)
        .set({ status: "completed" })
        .where(eq(payments.gatewayPaymentId, payment.id));

      // Update invoice if linked
      if (payment.invoice_id) {
        const invoice = await db
          .select()
          .from(invoices)
          .where(eq(invoices.id, payment.invoice_id))
          .limit(1);

        if (invoice[0]) {
          const newPaidAmount = (invoice[0].paidPaise ?? 0) + payment.amount;
          const newStatus = newPaidAmount >= (invoice[0].totalPaise ?? 0) ? "paid" : "partial";

          await db
            .update(invoices)
            .set({ paidPaise: newPaidAmount, status: newStatus })
            .where(eq(invoices.id, payment.invoice_id));
        }
      }

      return NextResponse.json({ status: "ok" });
    }

    // Handle payment failed event
    if (event === "payment.failed") {
      await db
        .update(payments)
        .set({ status: "failed" })
        .where(eq(payments.gatewayPaymentId, payment.id));

      return NextResponse.json({ status: "ok" });
    }

    return NextResponse.json({ status: "ignored", event });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Webhook processing failed" } },
      { status: 500 },
    );
  }
}
