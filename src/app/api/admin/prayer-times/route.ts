import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { canManagePrayerTimes, requireSession } from "@/lib/auth";
import {
  getDefaultPrayerTimesForDate,
  getPrayerTimesForDate,
  hasSavedDailyPrayerRules,
} from "@/lib/prayer-times";
import { DISPLAY_PRAYER_TIMES_CACHE_TAG } from "@/lib/display-api";
import {
  deleteMosquePrayerConfig,
  getMosquePrayerConfig,
  resetMosquePrayerSection,
  saveMosqueDailyConfig,
  saveMosqueEidConfig,
  saveMosqueJumuahSlots,
  serializeMosquePrayerConfig,
} from "@/lib/mosque-prayer-config";
import { toDateKey } from "@/lib/prayer-times-pure";
import type { DailyAdhanConfig } from "@/lib/prayer-adhan";
import type { DailyIqamaConfig } from "@/lib/prayer-iqama";
import { prayerTimesOverrideSchema } from "@/lib/validations";

type OverrideSection = "daily" | "jumuah" | "eid";

async function requirePrayerTimesAccess() {
  const session = await requireSession();
  if (!canManagePrayerTimes(session)) {
    throw new Error("Forbidden");
  }
  return session;
}

export async function GET(request: NextRequest) {
  try {
    await requirePrayerTimesAccess();

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const previewDate = dateParam ?? toDateKey(new Date());

    const [defaults, resolved, config] = await Promise.all([
      getDefaultPrayerTimesForDate(previewDate),
      getPrayerTimesForDate(previewDate),
      getMosquePrayerConfig(),
    ]);

    const mosqueConfig = serializeMosquePrayerConfig(config);

    return NextResponse.json({
      defaults,
      resolved,
      config: mosqueConfig,
      hasSavedDailyRules: hasSavedDailyPrayerRules(config),
      previewDate,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePrayerTimesAccess();
    const body = await request.json();

    if (body.action === "reset") {
      const section = body.section as OverrideSection | undefined;

      if (section) {
        await resetMosquePrayerSection(section);
        revalidateTag(DISPLAY_PRAYER_TIMES_CACHE_TAG);
        return NextResponse.json({ success: true });
      }

      await deleteMosquePrayerConfig();
      revalidateTag(DISPLAY_PRAYER_TIMES_CACHE_TAG);
      return NextResponse.json({ success: true });
    }

    const validated = prayerTimesOverrideSchema.parse(body);
    const section = validated.section;

    if (section === "daily") {
      await saveMosqueDailyConfig({
        adhanConfig: validated.adhanConfig as DailyAdhanConfig | undefined,
        iqamaConfig: validated.iqamaConfig as DailyIqamaConfig | undefined,
      });
    } else if (section === "jumuah") {
      await saveMosqueJumuahSlots(validated.jumuah ?? []);
    } else if (section === "eid") {
      if (!validated.eidType || !validated.eidDate) {
        return NextResponse.json({ error: "Eid type and date are required" }, { status: 400 });
      }
      await saveMosqueEidConfig({
        eidType: validated.eidType,
        eidDate: validated.eidDate,
        eidPrayers: validated.eidPrayers,
      });
    } else {
      await saveMosqueDailyConfig({
        adhanConfig: validated.adhanConfig as DailyAdhanConfig | undefined,
        iqamaConfig: validated.iqamaConfig as DailyIqamaConfig | undefined,
      });
      if (validated.jumuah?.length) {
        await saveMosqueJumuahSlots(validated.jumuah);
      }
      if (validated.eidType && validated.eidDate) {
        await saveMosqueEidConfig({
          eidType: validated.eidType,
          eidDate: validated.eidDate,
          eidPrayers: validated.eidPrayers,
        });
      }
    }

    const config = await getMosquePrayerConfig();
    revalidateTag(DISPLAY_PRAYER_TIMES_CACHE_TAG);

    return NextResponse.json(
      {
        config: serializeMosquePrayerConfig(config),
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid data";
    const status = message === "Unauthorized" || message === "Forbidden" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE() {
  try {
    await requirePrayerTimesAccess();
    await deleteMosquePrayerConfig();
    revalidateTag(DISPLAY_PRAYER_TIMES_CACHE_TAG);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    const status = message === "Unauthorized" || message === "Forbidden" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
