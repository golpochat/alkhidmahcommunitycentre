import { NextResponse } from "next/server";
import { getDisplaySettingsPayload } from "@/lib/display-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getDisplaySettingsPayload();
    return NextResponse.json(settings, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load display settings" },
      { status: 500 }
    );
  }
}
