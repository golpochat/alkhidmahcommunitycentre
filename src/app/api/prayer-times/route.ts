import { NextRequest, NextResponse } from "next/server";
import { getPrayerTimesForDate } from "@/lib/prayer-times";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  try {
    const data = await getPrayerTimesForDate(date);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch prayer times";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
