import "server-only";

import { db } from "@/lib/db";
import { getMonthlyTimetablePublishState } from "@/lib/monthly-timetable";
import { getSettingsMap } from "@/lib/queries";
import { getRamadanTimetableHomePublishState } from "@/lib/ramadan-timetable";
import { SETTING_KEYS } from "@/lib/settings";

function parseVisibleSetting(value: string | undefined) {
  if (value === "false") return false;
  return true;
}

export async function isPrayerTimetablesHomeBannerVisible() {
  const settings = await getSettingsMap();
  return parseVisibleSetting(
    settings[SETTING_KEYS.prayerTimetablesHomeBannerVisible],
  );
}

export async function getPrayerTimetablesHomeBannerState() {
  return { visible: await isPrayerTimetablesHomeBannerVisible() };
}

export async function setPrayerTimetablesHomeBannerVisible(visible: boolean) {
  await db.setting.upsert({
    where: { key: SETTING_KEYS.prayerTimetablesHomeBannerVisible },
    create: {
      key: SETTING_KEYS.prayerTimetablesHomeBannerVisible,
      value: String(visible),
    },
    update: { value: String(visible) },
  });
}

export async function getTimetableHomePublishOverview() {
  const [sectionVisible, monthly, ramadan] = await Promise.all([
    isPrayerTimetablesHomeBannerVisible(),
    getMonthlyTimetablePublishState(),
    getRamadanTimetableHomePublishState(),
  ]);

  return {
    sectionVisible,
    monthly,
    ramadan,
  };
}
