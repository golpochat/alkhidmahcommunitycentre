export const HIJRI_RAMADAN_YEAR_MIN = 1400;
export const HIJRI_RAMADAN_YEAR_MAX = 1500;

export type RamadanSeasonRole = "last" | "current" | "next" | "afterNext";

export interface RamadanSeasonSelectOption {
  role: RamadanSeasonRole;
  label: string;
  description: string;
  hijriYear: number;
  startDate: string;
  endDate: string;
}

/** Upcoming Ramadan season with Hijri day adjustment and month length. */
export interface UpcomingRamadanSeasonInfo {
  hijriYear: number;
  calculatedStartDate: string;
  calculatedEndDate: string;
  startDate: string;
  endDate: string;
  startDayOffset: number;
  isThirtyDayMonth: boolean;
  dayCount: number;
}

export const RAMADAN_START_DAY_OFFSET_MIN = -5;
export const RAMADAN_START_DAY_OFFSET_MAX = 5;

/** Effective season dates plus calculated (AlAdhan) baseline for moon-sighting UI. */
export interface RamadanSeasonInfo {
  hijriYear: number | null;
  startDate: string;
  endDate: string;
  calculatedStartDate: string;
  calculatedEndDate: string;
  isMoonSightingOverride: boolean;
}

export function isHijriRamadanStorageYear(year: number): boolean {
  return (
    Number.isInteger(year) &&
    year >= HIJRI_RAMADAN_YEAR_MIN &&
    year <= HIJRI_RAMADAN_YEAR_MAX
  );
}

/** Legacy timetables saved before Hijri-year storage (Gregorian season key). */
export function isLegacyGregorianRamadanYear(year: number): boolean {
  return Number.isInteger(year) && year >= 2020 && year <= 2100;
}

export function isValidRamadanStorageYear(year: number): boolean {
  return isHijriRamadanStorageYear(year) || isLegacyGregorianRamadanYear(year);
}
