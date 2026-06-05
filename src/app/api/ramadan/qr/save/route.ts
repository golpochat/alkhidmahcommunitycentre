import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ramadanStorageYearSchema } from "@/lib/ramadan-storage-year-schema";
import { saveRamadanPaymentQrs } from "@/lib/ramadan-payment-qr";
import { normalizeRamadanQrSlotCount } from "@/lib/ramadan-settings-types";
import { saveRamadanSettings } from "@/lib/ramadan-timetable";
import { requireTimetableAdmin } from "@/lib/timetable-api-auth";

const qrItemSchema = z.object({
  id: z.string().optional(),
  category: z.string(),
  url: z.string(),
  qrImage: z.string().nullable().optional(),
  order: z.number().int(),
  enabled: z.boolean(),
});

const saveSchema = z.object({
  year: ramadanStorageYearSchema,
  qrSlotCount: z.union([z.literal(3), z.literal(6)]),
  items: z.array(qrItemSchema).max(6),
});

export async function POST(request: NextRequest) {
  const auth = await requireTimetableAdmin();
  if (auth.error) return auth.error;

  try {
    const body = saveSchema.parse(await request.json());
    const slotCount = normalizeRamadanQrSlotCount(body.qrSlotCount);

    await saveRamadanSettings(body.year, { qrSlotCount: slotCount });
    const payload = await saveRamadanPaymentQrs(body.year, slotCount, body.items);

    return NextResponse.json({ success: true, ...payload });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
