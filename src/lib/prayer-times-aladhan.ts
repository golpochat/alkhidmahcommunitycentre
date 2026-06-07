import "server-only";

import { fetchAlAdhanJson } from "@/lib/aladhan-client";
import { CLONDLAKIN_COORDS } from "@/lib/constants";
import {
  toDateKey,
  type AlAdhanCalendarResponse,
} from "@/lib/prayer-times-pure";
import type { AlAdhanResponse } from "@/types";

function alAdhanLocationQuery() {
  return `latitude=${CLONDLAKIN_COORDS.latitude}&longitude=${CLONDLAKIN_COORDS.longitude}&method=4`;
}

function toGToHParam(dateKey: string) {
  const [year, month, day] = dateKey.split("-");
  return `${day}-${month}-${year}`;
}

export async function fetchAlAdhan(date: Date): Promise<AlAdhanResponse> {
  const dateKey = toDateKey(date);
  const alAdhanDate = toGToHParam(dateKey);
  const url = `https://api.aladhan.com/v1/timings/${alAdhanDate}?latitude=${CLONDLAKIN_COORDS.latitude}&longitude=${CLONDLAKIN_COORDS.longitude}&method=4`;
  return fetchAlAdhanJson<AlAdhanResponse>(url, `timings:${dateKey}`);
}

export async function fetchHijriDate(
  dateKey: string
): Promise<AlAdhanResponse["data"]["date"]["hijri"]> {
  const url = `https://api.aladhan.com/v1/gToH/${toGToHParam(dateKey)}`;
  const json = await fetchAlAdhanJson<{
    data: { hijri: AlAdhanResponse["data"]["date"]["hijri"] };
  }>(url, `gToH:${dateKey}`);

  return json.data.hijri;
}

/** Full Gregorian month in a single AlAdhan request. */
export async function fetchAlAdhanGregorianCalendar(
  month: number,
  year: number
): Promise<AlAdhanCalendarResponse> {
  const url = `https://api.aladhan.com/v1/calendar/${year}/${month}?${alAdhanLocationQuery()}`;
  return fetchAlAdhanJson<AlAdhanCalendarResponse>(url, `calendar:${year}-${month}`);
}

/** Full Hijri month (e.g. Ramadan = 9) in a single AlAdhan request. */
export async function fetchAlAdhanHijriCalendar(
  hijriYear: number,
  hijriMonth: number
): Promise<AlAdhanCalendarResponse> {
  const url = `https://api.aladhan.com/v1/hijriCalendar/${hijriYear}/${hijriMonth}?${alAdhanLocationQuery()}`;
  return fetchAlAdhanJson<AlAdhanCalendarResponse>(
    url,
    `hijriCalendar:${hijriYear}-${hijriMonth}`
  );
}
