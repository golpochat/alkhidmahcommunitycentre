"use client";

import { format, parseISO } from "date-fns";
import {
  formatRamadanDayNumber,
  formatRamadanTime,
  isRamadanEvenNightHighlight,
} from "@/lib/ramadan-format";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface RamadanTableRow {
  date: string;
  dayName: string;
  hijriDay: number | null;
  hijriDate: string;
  suhoorEnd: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  iftar: string;
  isha: string;
  isFriday: boolean;
  isLastTen: boolean;
  isOddNight: boolean;
}

type TimeField =
  | "suhoorEnd"
  | "fajr"
  | "sunrise"
  | "dhuhr"
  | "asr"
  | "maghrib"
  | "isha";

interface RamadanTableProps {
  rows: RamadanTableRow[];
  onUpdateRow: (index: number, patch: Partial<RamadanTableRow>) => void;
}

const TIME_COLUMNS: { key: TimeField; label: string }[] = [
  { key: "suhoorEnd", label: "Suhoor" },
  { key: "fajr", label: "Fajr" },
  { key: "sunrise", label: "Sunrise" },
  { key: "dhuhr", label: "Dhuhr" },
  { key: "asr", label: "Asr" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isha", label: "Isha" },
];

function EditableTimeCell({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      type="time"
      value={formatRamadanTime(value)}
      onChange={(event) => onChange(formatRamadanTime(event.target.value))}
      className="h-8 min-w-[68px] border-border bg-background px-2 text-xs"
    />
  );
}

export function RamadanTable({ rows, onUpdateRow }: RamadanTableProps) {
  function updateTime(index: number, field: TimeField, value: string) {
    const formatted = formatRamadanTime(value);
    if (field === "maghrib") {
      onUpdateRow(index, { maghrib: formatted, iftar: formatted });
      return;
    }
    onUpdateRow(index, { [field]: formatted });
  }

  return (
    <div className="admin-ramadan-timetable-details rounded-lg border border-border">
      <div className="admin-prayer-times-table-wrap overflow-x-auto p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ramadan</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Date</TableHead>
              {TIME_COLUMNS.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={row.date}
                className={cn(
                  row.isFriday && "bg-gold/10",
                  row.isLastTen && "admin-ramadan-row--last-ten",
                  row.isOddNight && row.isLastTen && "admin-ramadan-row--odd-night",
                  isRamadanEvenNightHighlight(row.hijriDay) &&
                    "admin-ramadan-row--even-night"
                )}
              >
                <TableCell className="whitespace-nowrap text-xs">
                  {formatRamadanDayNumber(row.hijriDay, row.hijriDate)}
                </TableCell>
                <TableCell className="text-xs">{row.dayName}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">
                  {format(parseISO(row.date), "d MMM")}
                </TableCell>
                {TIME_COLUMNS.map((column) => (
                  <TableCell key={column.key}>
                    <EditableTimeCell
                      value={row[column.key]}
                      onChange={(value) => updateTime(index, column.key, value)}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
