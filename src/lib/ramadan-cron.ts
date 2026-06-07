import "server-only";

import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { db } from "@/lib/db";
import {
  generateRamadanTimetable,
  getActiveRamadanYear,
  getRamadanSeasonDates,
  listRamadanTimetable,
  saveRamadanTimetable,
} from "@/lib/ramadan-timetable";
import { SETTING_KEYS } from "@/lib/settings";

async function findRelevantRamadanYear(today: string) {
  const candidates = [new Date().getFullYear(), new Date().getFullYear() + 1];

  for (const year of candidates) {
    try {
      const season = await getRamadanSeasonDates(year);
      if (today <= season.endDate) {
        return { year, season };
      }
    } catch {
      continue;
    }
  }

  return null;
}

export async function runRamadanAutomation() {
  const today = format(new Date(), "yyyy-MM-dd");
  const match = await findRelevantRamadanYear(today);

  if (!match) {
    return { generated: false, activated: false, reason: "no_season" };
  }

  const { year, season } = match;
  const daysUntilStart = differenceInCalendarDays(parseISO(season.startDate), parseISO(today));
  const inRamadan = today >= season.startDate && today <= season.endDate;

  let generated = false;
  const existingRows = await listRamadanTimetable(year);

  if (existingRows.length === 0 && daysUntilStart <= 30 && daysUntilStart >= 0) {
    const payload = await generateRamadanTimetable(year);
    await saveRamadanTimetable(year, payload.rows, {
      startDate: payload.startDate,
      endDate: payload.endDate,
    });
    generated = true;
  }

  let activated = false;
  const activeYear = await getActiveRamadanYear();

  if (inRamadan && activeYear !== year) {
    const rows = generated ? await listRamadanTimetable(year) : existingRows;
    if (rows.length > 0) {
      await db.setting.upsert({
        where: { key: SETTING_KEYS.ramadanActiveYear },
        create: { key: SETTING_KEYS.ramadanActiveYear, value: String(year) },
        update: { value: String(year) },
      });
      activated = true;
    }
  }

  return {
    generated,
    activated,
    year,
    inRamadan,
    daysUntilStart,
  };
}
