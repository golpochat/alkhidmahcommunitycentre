import "server-only";

import { format, parseISO } from "date-fns";
import { fetchAlAdhanHijriCalendar, fetchHijriDate } from "@/lib/prayer-times-aladhan";
import { parseAlAdhanGregorianDate, toDateKey } from "@/lib/prayer-times-pure";
import type {
  RamadanSeasonRole,
  RamadanSeasonSelectOption,
} from "@/lib/ramadan-season-types";

export interface RamadanSeason {
  hijriYear: number;
  startDate: string;
  endDate: string;
}

const ROLE_LABELS: Record<RamadanSeasonRole, string> = {
  last: "Last Ramadan",
  current: "Current Ramadan",
  next: "Next Ramadan",
  afterNext: "Ramadan after next",
};

const ROLE_OFFSET: Record<RamadanSeasonRole, number> = {
  last: -1,
  current: 0,
  next: 1,
  afterNext: 2,
};

export async function getRamadanSeasonForHijriYear(
  hijriYear: number
): Promise<RamadanSeason> {
  const calendar = await fetchAlAdhanHijriCalendar(hijriYear, 9);
  const days = calendar.data;

  if (!days?.length) {
    throw new Error(`No Ramadan calendar data for ${hijriYear} AH`);
  }

  return {
    hijriYear,
    startDate: parseAlAdhanGregorianDate(days[0].date.gregorian.date),
    endDate: parseAlAdhanGregorianDate(
      days[days.length - 1].date.gregorian.date
    ),
  };
}

async function listRamadanSeasonsAround(referenceDate: Date): Promise<RamadanSeason[]> {
  const hijri = await fetchHijriDate(toDateKey(referenceDate));
  const centerHijriYear = Number(hijri.year);
  const seasons: RamadanSeason[] = [];

  for (let offset = -3; offset <= 4; offset++) {
    const hijriYear = centerHijriYear + offset;
    try {
      seasons.push(await getRamadanSeasonForHijriYear(hijriYear));
    } catch {
      continue;
    }
  }

  return seasons.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

function formatSeasonDescription(season: RamadanSeason): string {
  const start = format(parseISO(season.startDate), "d MMM");
  const end = format(parseISO(season.endDate), "d MMM yyyy");
  return `${season.hijriYear} AH · ${start} – ${end}`;
}

function findCurrentSeasonIndex(seasons: RamadanSeason[], todayKey: string): number {
  const inProgress = seasons.findIndex(
    (season) => season.startDate <= todayKey && todayKey <= season.endDate
  );
  if (inProgress >= 0) return inProgress;

  const upcoming = seasons.findIndex((season) => season.startDate > todayKey);
  if (upcoming >= 0) return upcoming;

  return seasons.length - 1;
}

export async function getRamadanSeasonSelectOptions(
  referenceDate = new Date()
): Promise<RamadanSeasonSelectOption[]> {
  const seasons = await listRamadanSeasonsAround(referenceDate);

  if (seasons.length < 4) {
    throw new Error("Could not load enough Ramadan seasons from the Hijri calendar");
  }

  const todayKey = toDateKey(referenceDate);
  const currentIndex = findCurrentSeasonIndex(seasons, todayKey);
  const roles = Object.keys(ROLE_LABELS) as RamadanSeasonRole[];

  return roles.map((role) => {
    const seasonIndex = currentIndex + ROLE_OFFSET[role];
    const season = seasons[seasonIndex];

    if (!season) {
      throw new Error(`Missing Ramadan season for "${ROLE_LABELS[role]}"`);
    }

    return {
      role,
      label: ROLE_LABELS[role],
      description: formatSeasonDescription(season),
      hijriYear: season.hijriYear,
      startDate: season.startDate,
      endDate: season.endDate,
    };
  });
}

export function getRamadanPdfDisplayYear(
  storageYear: number,
  season: { startDate: string; endDate: string }
): number {
  if (season.endDate) {
    return parseISO(season.endDate).getFullYear();
  }
  return storageYear;
}
