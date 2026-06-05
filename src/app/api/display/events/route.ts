import { NextResponse } from "next/server";
import { getUpcomingDisplayEvents } from "@/lib/display-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const events = await getUpcomingDisplayEvents(3);
    return NextResponse.json(events, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load events" },
      { status: 500 }
    );
  }
}
