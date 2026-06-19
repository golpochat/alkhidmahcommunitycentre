import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getMonthlyTimetablePublishState,
  publishMonthlyTimetableToHomepage,
  unpublishMonthlyTimetableFromHomepage,
} from "@/lib/monthly-timetable";
import { requireTimetableAdmin } from "@/lib/timetable-api-auth";

const rowSchema = z.object({
  date: z.string(),
  dayName: z.string().optional(),
  fajrAdhan: z.string().optional(),
  fajrIqama: z.string().optional(),
  sunrise: z.string().optional(),
  dhuhrAdhan: z.string().optional(),
  dhuhrIqama: z.string().optional(),
  asrAdhan: z.string().optional(),
  asrIqama: z.string().optional(),
  maghribAdhan: z.string().optional(),
  maghribIqama: z.string().optional(),
  ishaAdhan: z.string().optional(),
  ishaIqama: z.string().optional(),
  notes: z.string().optional(),
  isFriday: z.boolean().optional(),
});

const publishSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  published: z.boolean(),
  rows: z.array(rowSchema).optional(),
});

export async function GET() {
  const auth = await requireTimetableAdmin();
  if (auth.error) return auth.error;

  const state = await getMonthlyTimetablePublishState();
  return NextResponse.json(state);
}

export async function POST(request: NextRequest) {
  const auth = await requireTimetableAdmin();
  if (auth.error) return auth.error;

  try {
    const body = publishSchema.parse(await request.json());

    if (body.published) {
      if (!body.rows?.length) {
        return NextResponse.json(
          { error: "Load the timetable before publishing to the homepage." },
          { status: 400 },
        );
      }

      await publishMonthlyTimetableToHomepage(
        body.month,
        body.year,
        body.rows.map((row) => ({
          date: row.date,
          dayName: row.dayName ?? "",
          fajrAdhan: row.fajrAdhan ?? "",
          fajrIqama: row.fajrIqama ?? "",
          sunrise: row.sunrise ?? "",
          dhuhrAdhan: row.dhuhrAdhan ?? "",
          dhuhrIqama: row.dhuhrIqama ?? "",
          asrAdhan: row.asrAdhan ?? "",
          asrIqama: row.asrIqama ?? "",
          maghribAdhan: row.maghribAdhan ?? "",
          maghribIqama: row.maghribIqama ?? "",
          ishaAdhan: row.ishaAdhan ?? "",
          ishaIqama: row.ishaIqama ?? "",
          notes: row.notes ?? "",
          isFriday: row.isFriday ?? false,
        })),
      );
    } else {
      await unpublishMonthlyTimetableFromHomepage();
    }

    const state = await getMonthlyTimetablePublishState();
    return NextResponse.json({ success: true, ...state });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publish update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
