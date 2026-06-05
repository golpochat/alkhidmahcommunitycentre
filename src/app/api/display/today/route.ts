import { NextResponse } from "next/server";
import { getDisplayTodayPayload } from "@/lib/display-api";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET() {
  try {
    const payload = await getDisplayTodayPayload();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load display data" },
      { status: 500 }
    );
  }
}
