import "server-only";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { SETTING_KEYS } from "@/lib/settings";

export const RAMADAN_PDF_FILENAME = "ramadan-timetable.pdf";
export const RAMADAN_PDF_PUBLIC_PATH = `/uploads/ramadan/${RAMADAN_PDF_FILENAME}`;

export async function saveRamadanPdfBuffer(buffer: Uint8Array) {
  const dir = path.join(process.cwd(), "public", "uploads", "ramadan");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, RAMADAN_PDF_FILENAME), buffer);

  await db.setting.upsert({
    where: { key: SETTING_KEYS.ramadanPdfPath },
    create: { key: SETTING_KEYS.ramadanPdfPath, value: RAMADAN_PDF_PUBLIC_PATH },
    update: { value: RAMADAN_PDF_PUBLIC_PATH },
  });

  return RAMADAN_PDF_PUBLIC_PATH;
}

export async function getSavedRamadanPdfPath() {
  const setting = await db.setting.findUnique({
    where: { key: SETTING_KEYS.ramadanPdfPath },
  });
  return setting?.value?.trim() || null;
}
