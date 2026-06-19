import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import {
  DISPLAY_TIMEZONE,
  getActiveFardPrayer,
  isFardPrayerActive,
  type PrayerSlot,
  type PrayerTimesResponse,
} from "@/lib/prayer-times-pure";

function dublinTime(hours: number, minutes: number) {
  return DateTime.fromObject(
    { hour: hours, minute: minutes },
    { zone: DISPLAY_TIMEZONE },
  ).toJSDate();
}

function prayerSlot(adhan: string, iqama: string): PrayerSlot {
  return { adhan, iqama, iqamaDisplay: iqama };
}

function weekdaySchedule(): PrayerTimesResponse {
  return {
    date: "2026-06-18",
    englishDate: "Thursday 18 June 2026",
    hijriDate: "3 Muharram 1448",
    hijriDateArabic: null,
    sunrise: "04:57",
    isFriday: false,
    prayers: {
      fajr: prayerSlot("03:00", "03:30"),
      dhuhr: prayerSlot("13:30", "13:45"),
      asr: prayerSlot("17:54", "18:14"),
      maghrib: prayerSlot("21:57", "22:04"),
      isha: prayerSlot("22:30", "22:45"),
    },
    jumuah: [],
    configuredJumuah: [],
    eid: { type: null, prayers: [] },
    nextPrayer: null,
  };
}

describe("getActiveFardPrayer", () => {
  const schedule = weekdaySchedule();

  it("returns null before the first prayer", () => {
    expect(getActiveFardPrayer(schedule, dublinTime(2, 0))).toBeNull();
  });

  it("returns the active prayer during its adhan–iqama window", () => {
    expect(getActiveFardPrayer(schedule, dublinTime(3, 0))).toBe("fajr");
    expect(getActiveFardPrayer(schedule, dublinTime(3, 30))).toBe("fajr");
    expect(getActiveFardPrayer(schedule, dublinTime(13, 40))).toBe("dhuhr");
    expect(getActiveFardPrayer(schedule, dublinTime(18, 0))).toBe("asr");
  });

  it("returns null between prayers", () => {
    expect(getActiveFardPrayer(schedule, dublinTime(4, 0))).toBeNull();
    expect(getActiveFardPrayer(schedule, dublinTime(14, 0))).toBeNull();
  });
});

describe("isFardPrayerActive for combined Maghrib/Isha", () => {
  const schedule: PrayerTimesResponse = {
    ...weekdaySchedule(),
    prayers: {
      ...weekdaySchedule().prayers,
      isha: {
        adhan: "22:30",
        iqama: "22:04",
        iqamaDisplay: "Follows Maghrib",
      },
    },
  };

  it("marks Isha active while Maghrib is in progress", () => {
    expect(isFardPrayerActive(schedule, "maghrib", dublinTime(22, 0))).toBe(
      true,
    );
    expect(isFardPrayerActive(schedule, "isha", dublinTime(22, 0))).toBe(true);
  });
});
