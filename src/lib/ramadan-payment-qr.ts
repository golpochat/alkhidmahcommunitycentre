import "server-only";

import { generateQrDataUrl } from "@/lib/qr";
import { db } from "@/lib/db";
import {
  mergePaymentQrSlots,
  normalizeRamadanQrSlotCount,
  RAMADAN_QR_MAX_SLOTS,
  type RamadanPaymentQRItem,
  type RamadanQrSlotCount,
} from "@/lib/ramadan-settings-types";

function mapDbRow(row: {
  id: string;
  category: string;
  url: string;
  qrImage: string | null;
  order: number;
  enabled: boolean;
}): RamadanPaymentQRItem {
  return {
    id: row.id,
    category: row.category,
    url: row.url,
    qrImage: row.qrImage,
    order: row.order,
    enabled: row.enabled,
  };
}

export async function listRamadanPaymentQrs(
  year: number,
  slotCount: RamadanQrSlotCount
): Promise<RamadanPaymentQRItem[]> {
  const rows = await db.ramadanPaymentQR.findMany({
    where: { year },
    orderBy: { order: "asc" },
  });

  return mergePaymentQrSlots(rows.map(mapDbRow), slotCount);
}

export async function getRamadanPaymentQrPayload(year: number, slotCount: RamadanQrSlotCount) {
  const items = await listRamadanPaymentQrs(year, slotCount);
  return { year, slotCount, items };
}

export async function saveRamadanPaymentQrs(
  year: number,
  slotCount: RamadanQrSlotCount,
  items: RamadanPaymentQRItem[]
) {
  const normalizedCount = normalizeRamadanQrSlotCount(slotCount);
  const slots = items.slice(0, normalizedCount).map((item, index) => ({
    ...item,
    order: index,
  }));

  await db.$transaction(async (tx) => {
    await tx.ramadanPaymentQR.deleteMany({ where: { year } });

    for (const slot of slots) {
      const category = slot.category.trim();
      const url = slot.url.trim();
      if (!category || !url || !slot.enabled) continue;

      const qrImage = slot.qrImage ?? (await generateQrDataUrl(url, 320));

      await tx.ramadanPaymentQR.create({
        data: {
          year,
          category,
          url,
          qrImage,
          order: slot.order,
          enabled: true,
        },
      });
    }
  });

  return getRamadanPaymentQrPayload(year, normalizedCount);
}

export function activeRamadanPaymentQrs(
  items: RamadanPaymentQRItem[],
  slotCount: RamadanQrSlotCount
) {
  return items
    .filter((item) => item.enabled && item.category.trim() && item.url.trim())
    .slice(0, slotCount);
}

export { RAMADAN_QR_MAX_SLOTS };
