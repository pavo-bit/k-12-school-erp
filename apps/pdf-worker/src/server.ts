import Fastify from "fastify";
import { z } from "zod";
import { renderReportCardPdf, renderReceiptPdf } from "@school-erp/documents";

const port = Number(process.env.PORT ?? 3002);
const host = process.env.HOST ?? "0.0.0.0";

const app = Fastify({ logger: true });

app.get("/healthz", async () => ({ status: "ok", service: "pdf-worker" }));
app.get("/readyz", async () => ({ status: "ready", service: "pdf-worker" }));

const ReportCardLineSchema = z.object({
  subject: z.string().min(1),
  code: z.string().nullable(),
  maxMarks: z.string(),
  passMarks: z.string(),
  theoryMarks: z.string().nullable(),
  practicalMarks: z.string().nullable(),
  obtained: z.string().nullable(),
  status: z.enum(["pass", "fail", "absent"]),
});

const ReportCardSchema = z.object({
  schoolName: z.string().min(1),
  academicYear: z.string().min(1),
  examName: z.string().min(1),
  examType: z.string().min(1),
  termName: z.string().nullable(),
  studentName: z.string().min(1),
  admissionNumber: z.string().min(1),
  className: z.string().min(1),
  sectionName: z.string().min(1),
  rollNumber: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  lines: z.array(ReportCardLineSchema).max(40),
  totalMax: z.string(),
  totalObtained: z.string(),
  percentage: z.string(),
  grade: z.string().nullable(),
  resultStatus: z.string().min(1),
  attendancePresent: z.number().nullable(),
  attendanceTotal: z.number().nullable(),
  generatedAt: z.string().min(1),
});

const ReceiptSchema = z.object({
  receiptNumber: z.string().min(1),
  invoiceNumber: z.string().min(1),
  schoolName: z.string().min(1),
  studentName: z.string().min(1),
  admissionNumber: z.string().min(1),
  amountPaise: z.number().int().nonnegative(),
  mode: z.string().min(1),
  paidOn: z.string().min(1),
});

const RenderSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("report_card"),
    filename: z.string().max(120).default("report-card.pdf"),
    data: ReportCardSchema,
  }),
  z.object({
    kind: z.literal("receipt"),
    filename: z.string().max(120).default("receipt.pdf"),
    data: ReceiptSchema,
  }),
]);

app.post("/render", async (request, reply) => {
  const parsed = RenderSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid render request.",
        details: parsed.error.flatten(),
      },
    });
  }

  try {
    const pdf =
      parsed.data.kind === "report_card"
        ? await renderReportCardPdf(parsed.data.data)
        : await renderReceiptPdf(parsed.data.data);

    return reply
      .code(200)
      .header("Content-Type", "application/pdf")
      .header(
        "Content-Disposition",
        `attachment; filename="${parsed.data.filename.replace(/["\r\n]/g, "")}"`,
      )
      .header("Content-Length", String(pdf.length))
      .send(pdf);
  } catch (error) {
    request.log.error(error);
    return reply
      .code(500)
      .send({ error: { code: "RENDER_FAILED", message: "PDF rendering failed." } });
  }
});

app
  .listen({ port, host })
  .then(() => {
    app.log.info(`pdf-worker listening on ${host}:${port}`);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
