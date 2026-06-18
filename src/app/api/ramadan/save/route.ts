import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertRamadanNotesWithinLimit, plainTextLengthFromHtml } from "@/lib/ramadan-notes-html";
import { ramadanStorageYearSchema } from "@/lib/ramadan-storage-year-schema";
import { saveRamadanTimetable } from "@/lib/ramadan-timetable";
import {
  normalizeRamadanQrSlotCount,
  RAMADAN_NOTES_HTML_MAX_LENGTH,
  RAMADAN_NOTES_MAX_LENGTH,
} from "@/lib/ramadan-settings-types";
import { requireTimetableAdmin } from "@/lib/timetable-api-auth";

const rowSchema = z.object({
  date: z.string(),
  dayName: z.string().optional(),
  hijriDay: z.number().int().nullable().optional(),
  hijriDate: z.string().optional(),
  suhoorEnd: z.string().optional(),
  fajr: z.string().optional(),
  sunrise: z.string().optional(),
  dhuhr: z.string().optional(),
  asr: z.string().optional(),
  maghrib: z.string().optional(),
  iftar: z.string().optional(),
  isha: z.string().optional(),
  taraweeh: z.string().optional(),
  notes: z.string().optional(),
  isCommunityIftar: z.boolean().optional(),
  isOddNight: z.boolean().optional(),
  isLastTen: z.boolean().optional(),
});

const settingsSchema = z.object({
  notesMessage: z
    .string()
    .max(RAMADAN_NOTES_HTML_MAX_LENGTH)
    .optional()
    .refine(
      (value) => !value || plainTextLengthFromHtml(value) <= RAMADAN_NOTES_MAX_LENGTH,
      { message: `Notes must be ${RAMADAN_NOTES_MAX_LENGTH} characters or fewer` }
    ),
  qrSlotCount: z.union([z.literal(3), z.literal(6)]).optional(),
  startDayOffset: z.number().int().min(-5).max(5).optional(),
  isThirtyDayMonth: z.boolean().optional(),
});

const saveSchema = z.object({
  year: ramadanStorageYearSchema,
  rows: z.array(rowSchema),
  settings: settingsSchema.optional(),
  season: z
    .object({
      startDate: z.string(),
      endDate: z.string(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireTimetableAdmin();
  if (auth.error) return auth.error;

  try {
    const body = saveSchema.parse(await request.json());
    const result = await saveRamadanTimetable(
      body.year,
      body.rows.map((row) => ({
        date: row.date,
        dayName: row.dayName ?? "",
        hijriDay: row.hijriDay ?? null,
        hijriDate: row.hijriDate ?? "",
        suhoorEnd: row.suhoorEnd ?? "",
        fajr: row.fajr ?? "",
        sunrise: row.sunrise ?? "",
        dhuhr: row.dhuhr ?? "",
        asr: row.asr ?? "",
        maghrib: row.maghrib ?? "",
        iftar: row.iftar ?? "",
        isha: row.isha ?? "",
        taraweeh: row.taraweeh ?? "",
        notes: row.notes ?? "",
        isCommunityIftar: row.isCommunityIftar ?? false,
        isOddNight: row.isOddNight ?? false,
        isLastTen: row.isLastTen ?? false,
        isFriday: false,
      })),
      body.season,
      body.settings
        ? {
            ...body.settings,
            notesMessage:
              body.settings.notesMessage !== undefined
                ? assertRamadanNotesWithinLimit(body.settings.notesMessage)
                : undefined,
            qrSlotCount: body.settings.qrSlotCount
              ? normalizeRamadanQrSlotCount(body.settings.qrSlotCount)
              : undefined,
          }
        : undefined
    );
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
