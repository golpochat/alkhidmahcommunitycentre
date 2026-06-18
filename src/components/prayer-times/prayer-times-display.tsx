import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  formatAdhanDisplay,
  formatIqamaDisplay,
  formatJumuahNoticeLine,
  formatPrayerTime24h,
  type NextPrayer,
  type PrayerSlot,
  type PrayerTimesResponse,
} from "@/lib/prayer-times-client";
import { EidPrayerBanner } from "@/components/prayer-times/eid-prayer-banner";
import { JumuahFridayRow } from "@/components/prayer-times/jumuah-friday-row";

interface PrayerRow {
  key: string;
  name: string;
  slot: PrayerSlot;
  muted?: boolean;
}

function isNextRow(nextPrayer: NextPrayer | null, name: string) {
  return Boolean(nextPrayer && nextPrayer.name === name);
}

function PrayerTableRow({
  row,
  nextPrayer,
  notice,
}: {
  row: PrayerRow;
  nextPrayer: NextPrayer | null;
  notice?: string;
}) {
  const isNext = isNextRow(nextPrayer, row.name);

  return (
    <TableRow
      className={cn(
        "prayer-times-table-row",
        isNext && "prayer-times-table-row-next",
        row.muted && "prayer-times-table-row-muted"
      )}
    >
      <TableCell className="prayer-times-table-cell prayer-times-table-cell-name">
        <span>{row.name}</span>
        {notice && <span className="jumuah-prayer-notice-inline">{notice}</span>}
      </TableCell>
      <TableCell className="prayer-times-table-cell prayer-times-table-cell-time text-right">
        {formatAdhanDisplay(row.slot)}
      </TableCell>
      <TableCell className="prayer-times-table-cell prayer-times-table-cell-time text-right">
        {row.key === "sunrise" ? "—" : formatIqamaDisplay(row.slot)}
      </TableCell>
    </TableRow>
  );
}

interface PrayerTimesDisplayProps {
  schedule: PrayerTimesResponse;
  showEidBanner?: boolean;
  showBadges?: boolean;
}

export function PrayerTimesDisplay({
  schedule,
  showEidBanner = true,
  showBadges = true,
}: PrayerTimesDisplayProps) {
  const nextPrayer = schedule.nextPrayer;
  const fridayJumuah = schedule.isFriday && schedule.jumuah.length > 0;
  const jumuahNotice =
    !schedule.isFriday && schedule.configuredJumuah.length > 0
      ? schedule.configuredJumuah
      : [];

  const fajrRow: PrayerRow = { key: "fajr", name: "Fajr", slot: schedule.prayers.fajr };
  const sunriseRow: PrayerRow | null = schedule.sunrise
    ? {
        key: "sunrise",
        name: "Sunrise",
        slot: { adhan: schedule.sunrise, iqama: null, iqamaDisplay: null },
      }
    : null;
  const dhuhrRow: PrayerRow | null =
    !fridayJumuah && schedule.prayers.dhuhr
      ? {
          key: "dhuhr",
          name: "Dhuhr",
          slot: schedule.prayers.dhuhr,
        }
      : null;

  const tailRows: PrayerRow[] = [
    { key: "asr", name: "Asr", slot: schedule.prayers.asr },
    { key: "maghrib", name: "Maghrib", slot: schedule.prayers.maghrib },
    { key: "isha", name: "Isha", slot: schedule.prayers.isha },
  ];

  return (
    <div>
      {showBadges && (
        <div className="mb-4 flex flex-wrap gap-2">
          {schedule.isFriday && (
            <Badge className="border-gold/30 bg-gold/10 text-gold">
              Friday (Jumu&apos;ah)
            </Badge>
          )}
        </div>
      )}

      {showEidBanner && schedule.eid.type && (
        <EidPrayerBanner eid={schedule.eid} />
      )}

      <div className="prayer-times-table-wrap">
        <Table className="prayer-times-table">
          <TableHeader>
            <TableRow className="prayer-times-table-head hover:bg-transparent">
              <TableHead className="prayer-times-table-head-cell">Prayer</TableHead>
              <TableHead className="prayer-times-table-head-cell text-right">
                Adhan
              </TableHead>
              <TableHead className="prayer-times-table-head-cell text-right">
                Iqama
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <PrayerTableRow row={fajrRow} nextPrayer={nextPrayer} />
            {sunriseRow && <PrayerTableRow row={sunriseRow} nextPrayer={nextPrayer} />}

            {fridayJumuah ? (
              <JumuahFridayRow
                jumuah={schedule.jumuah}
                nextPrayer={nextPrayer}
                asrAdhan={schedule.prayers.asr.adhan}
              />
            ) : (
              dhuhrRow && (
                <PrayerTableRow
                  row={dhuhrRow}
                  nextPrayer={nextPrayer}
                  notice={
                    jumuahNotice.length > 0
                      ? formatJumuahNoticeLine(jumuahNotice)
                      : undefined
                  }
                />
              )
            )}

            {tailRows.map((row) => (
              <PrayerTableRow key={row.key} row={row} nextPrayer={nextPrayer} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
