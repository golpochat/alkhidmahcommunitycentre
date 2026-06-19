import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getPrayerTimetablesHomeBannerState,
  setPrayerTimetablesHomeBannerVisible,
} from "@/lib/timetable-home-banner";
import { requireTimetableAdmin } from "@/lib/timetable-api-auth";

const updateSchema = z.object({
  visible: z.boolean(),
});

export async function GET() {
  const auth = await requireTimetableAdmin();
  if (auth.error) return auth.error;

  const state = await getPrayerTimetablesHomeBannerState();
  return NextResponse.json(state);
}

export async function POST(request: NextRequest) {
  const auth = await requireTimetableAdmin();
  if (auth.error) return auth.error;

  try {
    const body = updateSchema.parse(await request.json());
    await setPrayerTimetablesHomeBannerVisible(body.visible);
    const state = await getPrayerTimetablesHomeBannerState();
    return NextResponse.json({ success: true, ...state });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update homepage section";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
