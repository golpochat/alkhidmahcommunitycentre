import { NextRequest, NextResponse } from "next/server";
import {
  generateRamadanTimetable,
  getRamadanSettings,
  getRamadanSeasonDates,
  listRamadanTimetable,
} from "@/lib/ramadan-timetable";
import { activeRamadanPaymentQrs, listRamadanPaymentQrs } from "@/lib/ramadan-payment-qr";
import {
  ramadanTimetableToPdfBuffer,
  timetablePdfFilename,
} from "@/lib/timetable-pdf";
import { parseRamadanStorageYearParam } from "@/lib/ramadan-storage-year-schema";
import { requireTimetableAdmin } from "@/lib/timetable-api-auth";

async function buildRamadanPdfPayload(year: number) {
  let rows = await listRamadanTimetable(year);
  let season = await getRamadanSeasonDates(year);

  if (rows.length === 0) {
    const generated = await generateRamadanTimetable(year);
    rows = generated.rows;
    season = {
      startDate: generated.startDate,
      endDate: generated.endDate,
      hijriYear: generated.hijriYear,
    };
  }

  const settings = await getRamadanSettings(year);
  const paymentQrs = await listRamadanPaymentQrs(year, settings.qrSlotCount);

  return {
    year,
    hijriYear: season.hijriYear,
    startDate: season.startDate,
    endDate: season.endDate,
    rows,
    settings,
    paymentQrs: activeRamadanPaymentQrs(paymentQrs, settings.qrSlotCount),
  };
}

export async function GET(request: NextRequest) {
  const year = parseRamadanStorageYearParam(
    request.nextUrl.searchParams.get("year")
  );
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
