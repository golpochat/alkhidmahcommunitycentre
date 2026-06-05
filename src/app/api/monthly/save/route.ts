import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveMonthlyTimetable } from "@/lib/monthly-timetable";
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
});

const saveSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  rows: z.array(rowSchema),
});

export async function POST(request: NextRequest) {
  const auth = await requireTimetableAdmin();
  if (auth.error) return auth.error;

  try {
    const body = saveSchema.parse(await request.json());
    const rows = await saveMonthlyTimetable(
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
        isFriday: false,
      }))
    );
    return NextResponse.json({ success: true, rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
