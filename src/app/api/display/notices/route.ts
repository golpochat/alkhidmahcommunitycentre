import { NextResponse } from "next/server";
import { getActiveDisplayNotices } from "@/lib/display-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const notices = await getActiveDisplayNotices();
    return NextResponse.json(notices, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load notices" },
      { status: 500 }
    );
  }
}
