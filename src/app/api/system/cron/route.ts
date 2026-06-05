import { NextRequest, NextResponse } from "next/server";
import {
  expireDisplayNotices,
  refreshAyatCache,
} from "@/lib/display-api";
import { getSeasonalFlags } from "@/lib/seasonal";
import { getCachedPrayerTimesForDisplay } from "@/lib/display-api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "Cron secret not configured" },
      { status: 503 }
    );
  }

  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const schedule = await getCachedPrayerTimesForDisplay();
    const seasonal = await getSeasonalFlags(schedule);
    const expired = await expireDisplayNotices();
    const ayat = await refreshAyatCache();

    return NextResponse.json({
      ok: true,
      seasonal,
      expired,
      ayatCount: ayat.length,
      ranAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cron failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
