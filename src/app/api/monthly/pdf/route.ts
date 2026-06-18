import { NextRequest, NextResponse } from "next/server";
import {
  generateMonthlyTimetable,
  getPublishedMonthlyTimetable,
} from "@/lib/monthly-timetable";
import {
  monthlyTimetableToPdfBuffer,
  timetablePdfFilename,
} from "@/lib/timetable-pdf";
import { requireTimetableAdmin } from "@/lib/timetable-api-auth";

async function buildMonthlyPdfPayload(month: number, year: number) {
  return generateMonthlyTimetable(month, year);
}

export async function GET(request: NextRequest) {
  const published = await getPublishedMonthlyTimetable();
  const month = Number(
    request.nextUrl.searchParams.get("month") ?? published?.month ?? new Date().getMonth() + 1
  );
  const year = Number(
    request.nextUrl.searchParams.get("year") ?? published?.year ?? new Date().getFullYear()
  );

  try {
    const payload = await buildMonthlyPdfPayload(month, year);
    const buffer = await monthlyTimetableToPdfBuffer(payload);
    const filename = timetablePdfFilename("monthly", year, month);

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireTimetableAdmin();
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as { month?: number; year?: number };
    const now = new Date();
    const month = body.month ?? now.getMonth() + 1;
    const year = body.year ?? now.getFullYear();
    const payload = await buildMonthlyPdfPayload(month, year);
    const buffer = await monthlyTimetableToPdfBuffer(payload);
    const filename = timetablePdfFilename("monthly", year, month);

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
