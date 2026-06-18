import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getUpcomingRamadanTimetablePayload,
  updateUpcomingRamadanConfig,
} from "@/lib/ramadan-timetable";
import { requireTimetableAdmin } from "@/lib/timetable-api-auth";

const configSchema = z.object({
  startDayOffset: z.number().int().min(-5).max(5).optional(),
  isThirtyDayMonth: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireTimetableAdmin();
  if (auth.error) return auth.error;

  try {
    const payload = await getUpcomingRamadanTimetablePayload();
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load upcoming Ramadan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireTimetableAdmin();
  if (auth.error) return auth.error;

  try {
    const body = configSchema.parse(await request.json());
    const payload = await updateUpcomingRamadanConfig(body);
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update Ramadan config";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
