import "server-only";

import { Prisma } from "@prisma/client";
import { format } from "date-fns";
import { db } from "@/lib/db";
import {
  defaultAdhanConfig,
  hasAdhanOverrides,
  parseDailyAdhanConfig,
  type DailyAdhanConfig,
} from "@/lib/prayer-adhan";
import {
  DAILY_PRAYER_KEYS,
  defaultIqamaConfig,
  parseDailyIqamaConfig,
  type DailyIqamaConfig,
} from "@/lib/prayer-iqama";

export const MOSQUE_PRAYER_CONFIG_ID = "default";

const configInclude = {
  jumuahSlots: { orderBy: { index: "asc" as const } },
  eidSlots: { orderBy: { index: "asc" as const } },
};

export type MosquePrayerConfigWithRelations = Prisma.MosquePrayerConfigGetPayload<{
  include: typeof configInclude;
}>;

export interface MosquePrayerConfigRecord {
  id: string;
  adhanConfig: DailyAdhanConfig;
  iqamaConfig: DailyIqamaConfig;
  eidType: "FITR" | "ADHA" | null;
  eidDate: string | null;
  eidPrayers: Array<{ index: number; time: string }>;
  jumuah: Array<{
    id?: string;
    index: number;
    adhan: string | null;
    iqama: string | null;
  }>;
}

function mergeConfigJson<T extends Record<string, unknown>>(
  defaults: T,
  stored: Partial<T> | null | undefined,
): T {
  return { ...defaults, ...(stored ?? {}) };
}

export function hasSavedDailyPrayerRules(
  config: MosquePrayerConfigWithRelations | null | undefined,
) {
  if (!config) return false;

  const adhan = parseDailyAdhanConfig(config.dailyAdhanConfig);
  if (adhan && hasAdhanOverrides(adhan)) return true;

  const iqama = parseDailyIqamaConfig(config.dailyIqamaConfig);
  if (!iqama) return false;

  return DAILY_PRAYER_KEYS.some((key) => Boolean(iqama[key]));
}

export function serializeMosquePrayerConfig(
  config: MosquePrayerConfigWithRelations | null,
): MosquePrayerConfigRecord | null {
  if (!config) return null;

  const adhanConfig = mergeConfigJson(
    defaultAdhanConfig(),
    parseDailyAdhanConfig(config.dailyAdhanConfig) ?? undefined,
  );
  const iqamaConfig = mergeConfigJson(
    defaultIqamaConfig(),
    parseDailyIqamaConfig(config.dailyIqamaConfig) ?? undefined,
  );

  return {
    id: config.id,
    adhanConfig,
    iqamaConfig,
    eidType: (config.eidType as "FITR" | "ADHA" | null) ?? null,
    eidDate: config.eidDate ? format(config.eidDate, "yyyy-MM-dd") : null,
    eidPrayers: config.eidSlots.map((slot) => ({
      index: slot.index,
      time: slot.time || "",
    })),
    jumuah: config.jumuahSlots.map((slot) => ({
      id: slot.id,
      index: slot.index,
      adhan: slot.adhan,
      iqama: slot.iqama,
    })),
  };
}

export async function getMosquePrayerConfig(): Promise<MosquePrayerConfigWithRelations | null> {
  return db.mosquePrayerConfig.findUnique({
    where: { id: MOSQUE_PRAYER_CONFIG_ID },
    include: configInclude,
  });
}

async function ensureMosquePrayerConfig(): Promise<MosquePrayerConfigWithRelations> {
  return db.mosquePrayerConfig.upsert({
    where: { id: MOSQUE_PRAYER_CONFIG_ID },
    create: { id: MOSQUE_PRAYER_CONFIG_ID },
    update: {},
    include: configInclude,
  });
}

export async function saveMosqueDailyConfig(input: {
  adhanConfig?: DailyAdhanConfig;
  iqamaConfig?: DailyIqamaConfig;
}) {
  await db.mosquePrayerConfig.upsert({
    where: { id: MOSQUE_PRAYER_CONFIG_ID },
    create: {
      id: MOSQUE_PRAYER_CONFIG_ID,
      dailyAdhanConfig: (input.adhanConfig ?? Prisma.DbNull) as Prisma.InputJsonValue,
      dailyIqamaConfig: (input.iqamaConfig ?? Prisma.DbNull) as Prisma.InputJsonValue,
    },
    update: {
      dailyAdhanConfig: (input.adhanConfig ?? Prisma.DbNull) as Prisma.InputJsonValue,
      dailyIqamaConfig: (input.iqamaConfig ?? Prisma.DbNull) as Prisma.InputJsonValue,
    },
  });

  return getMosquePrayerConfig();
}

export async function saveMosqueJumuahSlots(
  slots: Array<{ index: number; adhan?: string | null; iqama?: string | null }>,
) {
  const config = await ensureMosquePrayerConfig();

  await db.$transaction([
    db.mosqueJumuahSlot.deleteMany({
      where: { mosquePrayerConfigId: config.id },
    }),
    ...(slots.length
      ? [
          db.mosqueJumuahSlot.createMany({
            data: slots.map((slot) => ({
              mosquePrayerConfigId: config.id,
              index: slot.index,
              adhan: slot.adhan ?? null,
              iqama: slot.iqama ?? slot.adhan ?? null,
            })),
          }),
        ]
      : []),
  ]);

  return getMosquePrayerConfig();
}

export async function saveMosqueEidConfig(input: {
  eidType: "FITR" | "ADHA";
  eidDate: string;
  eidPrayers?: Array<{ index: number; time?: string | null }>;
}) {
  const config = await ensureMosquePrayerConfig();
  const eidDate = new Date(`${input.eidDate}T00:00:00.000Z`);

  await db.mosquePrayerConfig.update({
    where: { id: config.id },
    data: {
      eidType: input.eidType,
      eidDate,
    },
  });

  await db.mosqueEidSlot.deleteMany({
    where: { mosquePrayerConfigId: config.id },
  });

  const prayers = input.eidPrayers?.filter((item) => item.time?.trim()) ?? [];
  if (prayers.length) {
    await db.mosqueEidSlot.createMany({
      data: prayers.map((item) => ({
        mosquePrayerConfigId: config.id,
        index: item.index,
        time: item.time ?? null,
      })),
    });
  }

  return getMosquePrayerConfig();
}

export async function resetMosquePrayerSection(section: "daily" | "jumuah" | "eid") {
  const config = await getMosquePrayerConfig();
  if (!config) return;

  if (section === "daily") {
    await db.mosquePrayerConfig.update({
      where: { id: config.id },
      data: {
        dailyAdhanConfig: Prisma.DbNull,
        dailyIqamaConfig: Prisma.DbNull,
      },
    });
    return;
  }

  if (section === "jumuah") {
    await db.mosqueJumuahSlot.deleteMany({
      where: { mosquePrayerConfigId: config.id },
    });
    return;
  }

  await db.$transaction([
    db.mosqueEidSlot.deleteMany({
      where: { mosquePrayerConfigId: config.id },
    }),
    db.mosquePrayerConfig.update({
      where: { id: config.id },
      data: {
        eidType: null,
        eidDate: null,
      },
    }),
  ]);
}

export async function deleteMosquePrayerConfig() {
  await db.mosquePrayerConfig.deleteMany({
    where: { id: MOSQUE_PRAYER_CONFIG_ID },
  });
}

export function getDailyAdhanConfigFromMosque(
  config: MosquePrayerConfigWithRelations | null,
) {
  return mergeConfigJson(
    defaultAdhanConfig(),
    parseDailyAdhanConfig(config?.dailyAdhanConfig) ?? undefined,
  );
}

export function getDailyIqamaConfigFromMosque(
  config: MosquePrayerConfigWithRelations | null,
) {
  return mergeConfigJson(
    defaultIqamaConfig(),
    parseDailyIqamaConfig(config?.dailyIqamaConfig) ?? undefined,
  );
}
