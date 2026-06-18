import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import {
  getRamadanSettings,
  getUpcomingRamadanTimetablePayload,
  listRamadanTimetable,
} from "@/lib/ramadan-timetable";
import { saveRamadanPdfBuffer, getSavedRamadanPdfPath, RAMADAN_PDF_FILENAME } from "@/lib/ramadan-pdf-storage";
import { activeRamadanPaymentQrs, listRamadanPaymentQrs } from "@/lib/ramadan-payment-qr";
import {
  ramadanTimetableToPdfBuffer,
  timetablePdfFilename,
} from "@/lib/timetable-pdf";
import { parseRamadanStorageYearParam } from "@/lib/ramadan-storage-year-schema";
import { requireTimetableAdmin } from "@/lib/timetable-api-auth";

async function buildRamadanPdfPayload(year: number) {
  const upcoming = await getUpcomingRamadanTimetablePayload();
  if (upcoming.year !== year) {
    throw new Error("Only the upcoming Ramadan timetable can be exported.");
  }

  let rows = await listRamadanTimetable(year);
  if (rows.length === 0) {
    rows = upcoming.rows;
  }

  const settings = await getRamadanSettings(year);
  const paymentQrs = await listRamadanPaymentQrs(year, settings.qrSlotCount);

  return {
    year,
    hijriYear: upcoming.season.hijriYear,
    startDate: upcoming.season.startDate,
    endDate: upcoming.season.endDate,
    rows,
    settings,
    paymentQrs: activeRamadanPaymentQrs(paymentQrs, settings.qrSlotCount),
  };
}

async function readSavedRamadanPdf() {
  const savedPath = await getSavedRamadanPdfPath();
  if (!savedPath) return null;

  const filePath = path.join(process.cwd(), "public", savedPath.replace(/^\//, ""));
  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const yearParam = request.nextUrl.searchParams.get("year");
  const saved = await readSavedRamadanPdf();

  if (!yearParam && saved) {
    return new NextResponse(Buffer.from(saved), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${RAMADAN_PDF_FILENAME}"`,
      },
    });
  }

  const year = parseRamadanStorageYearParam(yearParam);
  if (year == null) {
    return NextResponse.json({ error: "Invalid Ramadan season year" }, { status: 400 });
  }

  try {
    const payload = await buildRamadanPdfPayload(year);
    const buffer = await ramadanTimetableToPdfBuffer(payload);
    const filename = timetablePdfFilename("ramadan", year);

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
    const body = (await request.json()) as { year?: number };
    const year =
      body.year != null ? parseRamadanStorageYearParam(String(body.year)) : null;
    if (year == null) {
      return NextResponse.json({ error: "Invalid Ramadan season year" }, { status: 400 });
    }
    const payload = await buildRamadanPdfPayload(year);
    const buffer = await ramadanTimetableToPdfBuffer(payload);
    const filename = timetablePdfFilename("ramadan", year);
    await saveRamadanPdfBuffer(buffer);

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
