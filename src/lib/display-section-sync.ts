import "server-only";

import type { MessageState } from "@prisma/client";
import { db } from "@/lib/db";
import { refreshAyatCache } from "@/lib/display-api";
import { ensureDisplaySettings, serializeDisplaySettings } from "@/lib/display-settings";
import {
  buildEnabledPanels,
  DISPLAY_PANEL_AYAT_HADITH,
  DISPLAY_PANEL_NORMAL_MESSAGES,
  DISPLAY_PANEL_PRIORITY_MESSAGES,
  isWeatherEnabled,
  panelsEqual,
  setDisplayPanelEnabled as mergeDisplayPanelEnabled,
} from "@/lib/display-settings-types";
import { hasMessageScheduleEnded } from "@/lib/message-schedule";

function isMessageOnTv(message: {
  status: string;
  includeInRotation: boolean;
}) {
  return message.status === "ACTIVE" && message.includeInRotation;
}

export function displayPanelForMessageState(state: MessageState) {
  return state === "PRIORITY"
    ? DISPLAY_PANEL_PRIORITY_MESSAGES
    : DISPLAY_PANEL_NORMAL_MESSAGES;
}

async function writeDisplayPanels(nextPanels: string[]) {
  const settings = await ensureDisplaySettings();

  if (panelsEqual(nextPanels, settings.enabledPanels)) {
    return settings;
  }

  return db.displaySettings.update({
    where: { id: settings.id },
    data: { enabledPanels: nextPanels },
  });
}

async function updateDisplayPanelFlag(panel: string, enabled: boolean) {
  const settings = await ensureDisplaySettings();
  const nextPanels = mergeDisplayPanelEnabled(
    settings.enabledPanels,
    panel,
    enabled,
  );
  return writeDisplayPanels(nextPanels);
}

export async function deactivateExpiredMessages(now = new Date()) {
  const candidates = await db.message.findMany({
    where: {
      endsAt: { not: null },
      OR: [{ status: "ACTIVE" }, { includeInRotation: true }],
    },
  });

  const expiredIds = candidates
    .filter((message) => hasMessageScheduleEnded(message, now))
    .map((message) => message.id);

  if (!expiredIds.length) {
    return 0;
  }

  await db.message.updateMany({
    where: { id: { in: expiredIds } },
    data: {
      status: "INACTIVE",
      includeInRotation: false,
    },
  });

  return expiredIds.length;
}

export async function disableAllMessagesInSection(state: MessageState) {
  await db.message.updateMany({
    where: { state },
    data: {
      status: "INACTIVE",
      includeInRotation: false,
    },
  });
}

export async function disableAllAyatInRotation() {
  await db.ayahRotation.updateMany({
    data: { includeInRotation: false },
  });
  await refreshAyatCache();
}

export async function enableAllMessagesInSection(
  state: MessageState,
  now = new Date(),
) {
  const messages = await db.message.findMany({
    where: { state },
  });

  const eligibleIds = messages
    .filter((message) => !hasMessageScheduleEnded(message, now))
    .map((message) => message.id);

  if (!eligibleIds.length) {
    return 0;
  }

  await db.message.updateMany({
    where: { id: { in: eligibleIds } },
    data: {
      status: "ACTIVE",
      includeInRotation: true,
    },
  });

  return eligibleIds.length;
}

export async function enableAllAyatInRotation() {
  const result = await db.ayahRotation.updateMany({
    data: { includeInRotation: true },
  });
  await refreshAyatCache();
  return result.count;
}

async function sectionHasAnyMessageOnTv(
  state: MessageState,
  now = new Date(),
) {
  const messages = await db.message.findMany({
    where: { state },
  });

  return messages.some(
    (message) =>
      isMessageOnTv(message) && !hasMessageScheduleEnded(message, now),
  );
}

async function sectionHasAnyAyahOnTv() {
  const count = await db.ayahRotation.count({
    where: { includeInRotation: true },
  });
  return count > 0;
}

export async function syncDisplayPanelForMessages(
  state: MessageState,
  now = new Date(),
) {
  const enabled = await sectionHasAnyMessageOnTv(state, now);
  return updateDisplayPanelFlag(displayPanelForMessageState(state), enabled);
}

export async function syncDisplayPanelForAyat() {
  const enabled = await sectionHasAnyAyahOnTv();
  return updateDisplayPanelFlag(DISPLAY_PANEL_AYAT_HADITH, enabled);
}

export async function syncAllDisplaySectionPanels(now = new Date()) {
  const settings = await ensureDisplaySettings();
  const [priorityOn, normalOn, ayatOn] = await Promise.all([
    sectionHasAnyMessageOnTv("PRIORITY", now),
    sectionHasAnyMessageOnTv("NON_PRIORITY", now),
    sectionHasAnyAyahOnTv(),
  ]);

  const nextPanels = buildEnabledPanels({
    showWeather: isWeatherEnabled(settings.enabledPanels),
    priorityMessages: priorityOn,
    normalMessages: normalOn,
    ayatHadith: ayatOn,
  });

  return writeDisplayPanels(nextPanels);
}

export async function applyMasterDisplayPanelToggle(
  panel: string,
  enabled: boolean,
): Promise<{ settings: Awaited<ReturnType<typeof ensureDisplaySettings>>; enabledItemCount: number }> {
  if (!enabled) {
    if (panel === DISPLAY_PANEL_PRIORITY_MESSAGES) {
      await disableAllMessagesInSection("PRIORITY");
    } else if (panel === DISPLAY_PANEL_NORMAL_MESSAGES) {
      await disableAllMessagesInSection("NON_PRIORITY");
    } else if (panel === DISPLAY_PANEL_AYAT_HADITH) {
      await disableAllAyatInRotation();
    }

    const settings = await updateDisplayPanelFlag(panel, false);
    return { settings, enabledItemCount: 0 };
  }

  let enabledItemCount = 0;

  if (panel === DISPLAY_PANEL_PRIORITY_MESSAGES) {
    enabledItemCount = await enableAllMessagesInSection("PRIORITY");
  } else if (panel === DISPLAY_PANEL_NORMAL_MESSAGES) {
    enabledItemCount = await enableAllMessagesInSection("NON_PRIORITY");
  } else if (panel === DISPLAY_PANEL_AYAT_HADITH) {
    enabledItemCount = await enableAllAyatInRotation();
  }

  const settings = await updateDisplayPanelFlag(panel, enabledItemCount > 0);
  return { settings, enabledItemCount };
}

export async function maintainDisplaySections(now = new Date()) {
  const expiredCount = await deactivateExpiredMessages(now);
  await syncAllDisplaySectionPanels(now);
  return expiredCount;
}

export async function getSerializedDisplaySettings() {
  const settings = await ensureDisplaySettings();
  return serializeDisplaySettings(settings);
}
