import { NextResponse } from "next/server";
import { getDisplayAyat } from "@/lib/display-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ayat = await getDisplayAyat();
    return NextResponse.json(ayat, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load ayat" },
      { status: 500 }
    );
  }
}
