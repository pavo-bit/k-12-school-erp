import { NextResponse } from "next/server";
import { getReportCard } from "@school-erp/exams";
import { createLocalStorage } from "@school-erp/storage";
import { withParentChildApi } from "@/server/with-mobile-api";

const storage = createLocalStorage(process.env.LOCAL_STORAGE_PATH ?? "./.local/storage");

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string; reportCardId: string }> },
) {
  const { studentId, reportCardId } = await params;
  return withParentChildApi(request, studentId, async (ctx) => {
    const card = await getReportCard(reportCardId);
    if (
      !card ||
      card.schoolId !== ctx.schoolId ||
      card.studentId !== studentId ||
      card.status !== "published"
    ) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Published report card not found." } },
        { status: 404 },
      );
    }

    if (!card.objectPath) {
      return NextResponse.json(
        { error: { code: "NOT_STORED", message: "This report card PDF is not available yet." } },
        { status: 404 },
      );
    }

    try {
      const pdf = await storage.get(card.objectPath);
      return new NextResponse(new Uint8Array(pdf), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="report-card-${card.id}.pdf"`,
          "Content-Length": String(pdf.length),
          "Cache-Control": "private, no-store",
        },
      });
    } catch {
      return NextResponse.json(
        { error: { code: "STORAGE_MISSING", message: "The stored report card PDF is missing." } },
        { status: 410 },
      );
    }
  });
}
