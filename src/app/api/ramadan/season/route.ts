import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ramadanStorageYearSchema } from "@/lib/ramadan-storage-year-schema";
import {
  resetRamadanMoonSightingDates,
  saveRamadanMoonSightingDates,
} from "@/lib/ramadan-timetable";
import { requireTimetableAdmin } from "@/lib/timetable-api-auth";

const seasonSchema = z
  .object({
    year: ramadanStorageYearSchema,
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reset: z.literal(false).optional(),
  })
  .or(
    z.object({
      year: ramadanStorageYearSchema,
      reset: z.literal(true),
    })
  );

export async function POST(request: NextRequest) {
  const auth = await requireTimetableAdmin();
  if (auth.error) return auth.error;

  try {
    const body = seasonSchema.parse(await request.json());

    const season =
      "reset" in body && body.reset
        ? await resetRamadanMoonSightingDates(body.year)
        : await saveRamadanMoonSightingDates(
            body.year,
            body.startDate,
            body.endDate
          );

    return NextResponse.json({ success: true, season });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid moon sighting dates" },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to save season dates";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
