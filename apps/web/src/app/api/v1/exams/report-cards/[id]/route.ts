import { NextResponse } from "next/server";
import { withApi } from "@/server/with-api";
import { getReportCard } from "@school-erp/exams";
import { createLocalStorage } from "@school-erp/storage";

const storage = createLocalStorage(process.env.LOCAL_STORAGE_PATH ?? "./.local/storage");

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApi(request, async (ctx) => {
    if (!ctx.schoolId)
      return NextResponse.json(
        { error: { code: "TENANT_REQUIRED", message: "School context required." } },
        { status: 400 },
      );
    const { id } = await params;
    const card = await getReportCard(id);
    if (!card || card.schoolId !== ctx.schoolId)
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Report card not found." } },
        { status: 404 },
      );
    if (!card.objectPath)
      return NextResponse.json(
        { error: { code: "NOT_STORED", message: "This report card was not stored." } },
        { status: 404 },
      );
    try {
      const pdf = await storage.get(card.objectPath);
      return new NextResponse(new Uint8Array(pdf), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="report-card-${card.id}.pdf"`,
          "Content-Length": String(pdf.length),
        },
      });
    } catch {
      return NextResponse.json(
        { error: { code: "STORAGE_MISSING", message: "Stored PDF is missing." } },
        { status: 410 },
      );
    }
  });
}
