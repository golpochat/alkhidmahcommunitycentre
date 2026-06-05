import { format, parseISO } from "date-fns";

export function formatRamadanTime(value?: string | null): string {
  if (!value?.trim()) return "";
  const normalized = value.trim().split(" ")[0];
  const [hoursRaw, minutesRaw] = normalized.split(":");
  if (!hoursRaw || minutesRaw === undefined) return normalized;

  const hours = hoursRaw.padStart(2, "0");
  const minutes = minutesRaw.padStart(2, "0").slice(0, 2);
  return `${hours}:${minutes}`;
}

export function formatRamadanGregorianDate(dateKey: string): string {
  return format(parseISO(dateKey), "dd/MM/yy");
}

export function formatRamadanDayNumber(
  hijriDay?: number | null,
  hijriDate?: string | null
): string {
  if (hijriDay != null && hijriDay > 0) {
    return String(hijriDay);
  }

  const match = hijriDate?.trim().match(/^(\d{1,2})\b/);
  return match?.[1] ?? "";
}

export function formatRamadanSeasonRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return "";
  return `${format(parseISO(startDate), "d MMM")} – ${format(parseISO(endDate), "d MMM yyyy")}`;
}

function formatOrdinalDay(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return `${day}th`;
  }

  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

export function formatRamadanDayAndDate(dayName: string, dateKey: string): string {
  const date = parseISO(dateKey);
  const fullDay = dayName.trim() || format(date, "EEEE");
  const dayOfMonth = Number(format(date, "d"));
  const month = format(date, "MMM");
  return `${fullDay} - ${formatOrdinalDay(dayOfMonth)} ${month}`;
}

const RAMADAN_EVEN_NIGHT_HIGHLIGHT_DAYS = new Set([20, 22, 24, 26, 28]);

export function isRamadanEvenNightHighlight(hijriDay?: number | null): boolean {
  return hijriDay != null && RAMADAN_EVEN_NIGHT_HIGHLIGHT_DAYS.has(hijriDay);
}

export function formatRamadanTimetableTitle(year: number): string {
  return `Ramadan Timetable ${year}`;
}

function toArabicIndicDigits(value: number): string {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(value)
    .split("")
    .map((digit) => arabicDigits[Number(digit)] ?? digit)
    .join("");
}

export function formatRamadanArabicSubtitle(hijriYear?: number | null): string {
  if (!hijriYear) return "رمضان";
  return `رمضان ${toArabicIndicDigits(hijriYear)} هـ`;
}

export function normalizeRamadanRowTimes<
  T extends {
    suhoorEnd?: string;
    fajr?: string;
    sunrise?: string;
    dhuhr?: string;
    asr?: string;
    maghrib?: string;
    iftar?: string;
    isha?: string;
    taraweeh?: string;
  },
>(row: T): T {
  return {
    ...row,
    suhoorEnd: formatRamadanTime(row.suhoorEnd),
    fajr: formatRamadanTime(row.fajr),
    sunrise: formatRamadanTime(row.sunrise),
    dhuhr: formatRamadanTime(row.dhuhr),
    asr: formatRamadanTime(row.asr),
    maghrib: formatRamadanTime(row.maghrib),
    iftar: formatRamadanTime(row.iftar ?? row.maghrib),
    isha: formatRamadanTime(row.isha),
    taraweeh: formatRamadanTime(row.taraweeh),
  };
}
