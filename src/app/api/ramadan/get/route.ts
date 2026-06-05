import { NextRequest, NextResponse } from "next/server";
import { parseRamadanStorageYearParam } from "@/lib/ramadan-storage-year-schema";
import { getRamadanTimetablePayload } from "@/lib/ramadan-timetable";
import { requireTimetableAdmin } from "@/lib/timetable-api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireTimetableAdmin();
  if (auth.error) return auth.error;

  const year = parseRamadanStorageYearParam(
    request.nextUrl.searchParams.get("year")
  );
  if (year == null) {
    return NextResponse.json({ error: "Invalid Ramadan season year" }, { status: 400 });
  }

  try {
    const payload = await getRamadanTimetablePayload(year);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Ramadan timetable";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
