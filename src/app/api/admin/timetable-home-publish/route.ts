import { NextResponse } from "next/server";
import { getTimetableHomePublishOverview } from "@/lib/timetable-home-banner";
import { requireTimetableAdmin } from "@/lib/timetable-api-auth";

export async function GET() {
  const auth = await requireTimetableAdmin();
  if (auth.error) return auth.error;

  const overview = await getTimetableHomePublishOverview();
  return NextResponse.json(overview);
}
