import { NextResponse } from "next/server";
import { getRamadanSeasonSelectOptions } from "@/lib/ramadan-seasons";
import { requireTimetableAdmin } from "@/lib/timetable-api-auth";

export async function GET() {
  const auth = await requireTimetableAdmin();
  if (auth.error) return auth.error;

  try {
    const options = await getRamadanSeasonSelectOptions();
    return NextResponse.json({ options });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load Ramadan seasons";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
