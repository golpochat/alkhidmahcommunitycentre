import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateMonthlyTimetable, listMonthlyTimetable } from "@/lib/monthly-timetable";
import { requireTimetableAdmin } from "@/lib/timetable-api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireTimetableAdmin();
  if (auth.error) return auth.error;

  const month = Number(request.nextUrl.searchParams.get("month") ?? new Date().getMonth() + 1);
  const year = Number(request.nextUrl.searchParams.get("year") ?? new Date().getFullYear());

  const rows = await listMonthlyTimetable(month, year);
  return NextResponse.json({ month, year, rows });
}

const generateSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

export async function POST(request: NextRequest) {
  const auth = await requireTimetableAdmin();
  if (auth.error) return auth.error;

  try {
    const body = generateSchema.parse(await request.json());
    const result = await generateMonthlyTimetable(body.month, body.year);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
