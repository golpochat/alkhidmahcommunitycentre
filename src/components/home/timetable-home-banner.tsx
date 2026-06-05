import Link from "next/link";
import { FileDown, Moon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { isHijriRamadanStorageYear } from "@/lib/ramadan-season-types";
import {
  getActiveRamadanYear,
  getRamadanSeasonDates,
  listRamadanTimetable,
} from "@/lib/ramadan-timetable";
import { getPublishedMonthlyTimetable } from "@/lib/monthly-timetable";

export async function TimetableHomeBanner() {
  const [ramadanYear, publishedMonthly] = await Promise.all([
    getActiveRamadanYear(),
    getPublishedMonthlyTimetable(),
  ]);

  let ramadanLink: string | null = null;
  let ramadanLabel: string | null = null;

  if (ramadanYear) {
    try {
      const season = await getRamadanSeasonDates(ramadanYear);
      const rows = await listRamadanTimetable(ramadanYear);
      if (rows.length > 0 || season.startDate) {
        ramadanLink = `/api/ramadan/pdf?year=${ramadanYear}`;
        const seasonLabel = isHijriRamadanStorageYear(ramadanYear)
          ? `${ramadanYear} AH`
          : String(ramadanYear);
        ramadanLabel = `Ramadan ${seasonLabel} · ${format(parseISO(season.startDate), "d MMM")} – ${format(parseISO(season.endDate), "d MMM yyyy")}`;
      }
    } catch {
      // no active ramadan season configured
    }
  }

  if (!ramadanLink && !publishedMonthly) {
    return null;
  }

  const monthlyLink = publishedMonthly
    ? `/api/monthly/pdf?month=${publishedMonthly.month}&year=${publishedMonthly.year}`
    : null;
  const monthlyLabel = publishedMonthly
    ? `${format(new Date(publishedMonthly.year, publishedMonthly.month - 1, 1), "MMMM yyyy")} prayer timetable`
    : null;

  return (
    <section className="border-y border-gold/20 bg-secondary/40 py-8">
      <div className="container-narrow flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Moon className="mt-1 h-6 w-6 shrink-0 text-gold" />
          <div>
            <h2 className="font-heading text-xl font-semibold text-gold">Prayer timetables</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Download the latest Ramadan and monthly prayer schedules for Al Khidmah.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {ramadanLink && ramadanLabel && (
            <Link
              href={ramadanLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg border border-gold/40 px-4 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/10"
            >
              <FileDown className="mr-2 h-4 w-4" />
              {ramadanLabel}
            </Link>
          )}
          {monthlyLink && monthlyLabel && (
            <Link href={monthlyLink} target="_blank" rel="noopener noreferrer" className="btn-gold inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium">
              <FileDown className="mr-2 h-4 w-4" />
              {monthlyLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
