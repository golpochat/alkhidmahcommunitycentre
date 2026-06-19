import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { resolveDisplayCountdown } from "@/lib/seasonal-client";
import type { SeasonalFlags } from "@/lib/seasonal-types";
import {
  DISPLAY_TIMEZONE,
  findNextPrayer,
  type PrayerSlot,
  type PrayerTimesResponse,
} from "@/lib/prayer-times-pure";

function dublinTime(hours: number, minutes: number) {
  return DateTime.fromObject(
    { hour: hours, minute: minutes, second: 0 },
    { zone: DISPLAY_TIMEZONE },
  ).toJSDate();
}

function prayerSlot(adhan: string, iqama: string): PrayerSlot {
  return { adhan, iqama, iqamaDisplay: iqama };
}

function fridaySchedule(): PrayerTimesResponse {
  return {
    date: "2026-06-19",
    englishDate: "Friday 19 June 2026",
    hijriDate: "4 Muharram 1448",
    hijriDateArabic: null,
    sunrise: "04:57",
    isFriday: true,
    prayers: {
      fajr: prayerSlot("03:00", "04:00"),
      dhuhr: prayerSlot("13:00", "13:30"),
      asr: prayerSlot("17:54", "18:14"),
      maghrib: prayerSlot("21:57", "22:04"),
      isha: prayerSlot("22:30", "22:45"),
    },
    jumuah: [
      { index: 1, adhan: "13:15", iqama: "13:15" },
      { index: 2, adhan: "14:15", iqama: "14:15" },
      { index: 3, adhan: "15:15", iqama: "15:15" },
    ],
    configuredJumuah: [],
    eid: { type: null, prayers: [] },
    nextPrayer: null,
  };
}

const seasonalOff: SeasonalFlags = {
  isRamadan: false,
  isEid: false,
  isJumuah: false,
};

describe("findNextPrayer on Friday", () => {
  const schedule = fridaySchedule();

  it("returns Fajr before dawn", () => {
    const next = findNextPrayer(schedule, dublinTime(2, 5));
    expect(next?.name).toBe("Fajr");
    expect(next?.time).toBe("03:00");
  });

  it("returns Sunrise after Fajr adhan", () => {
    const next = findNextPrayer(schedule, dublinTime(3, 30));
    expect(next?.name).toBe("Sunrise");
    expect(next?.time).toBe("04:57");
  });

  it("returns the first Jumu'ah after Sunrise", () => {
    const next = findNextPrayer(schedule, dublinTime(5, 0));
    expect(next?.type).toBe("jumuah");
    expect(next?.time).toBe("13:15");
  });
});

describe("resolveDisplayCountdown on Friday", () => {
  const schedule = fridaySchedule();

  it("counts down to Fajr before dawn instead of Jumu'ah", () => {
    const active = resolveDisplayCountdown(schedule, seasonalOff, [], dublinTime(2, 5));

    expect(active.type).toBe("prayer");
    if (active.type !== "prayer") return;

    expect(active.label).toBe("Fajr in");
    expect(active.seconds).toBeGreaterThan(0);
    expect(active.seconds).toBeLessThan(60 * 60);
  });

  it("counts down to Sunrise after Fajr adhan", () => {
    const active = resolveDisplayCountdown(schedule, seasonalOff, [], dublinTime(3, 30));

    expect(active.type).toBe("prayer");
    if (active.type !== "prayer") return;

    expect(active.label).toBe("Sunrise in");
  });

  it("counts down to the first Jumu'ah after Sunrise", () => {
    const active = resolveDisplayCountdown(schedule, seasonalOff, [], dublinTime(5, 0));

    expect(active.type).toBe("prayer");
    if (active.type !== "prayer") return;

    expect(active.label).toBe("1st Jumu'ah in");
  });
});
