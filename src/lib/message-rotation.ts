import "server-only";

import { db } from "@/lib/db";
import { maintainDisplaySections } from "@/lib/display-section-sync";
import { ensureDisplaySettings } from "@/lib/display-settings";
import {
  isNormalMessagesEnabled,
  isPriorityMessagesEnabled,
} from "@/lib/display-settings-types";
import {
  isMessageRotationEligible,
  serializeMessage,
} from "@/lib/messages";
import type { SerializedMessage } from "@/lib/message-types";

export async function getRotationQueue(now = new Date()): Promise<SerializedMessage[]> {
  await maintainDisplaySections(now);

  const settings = await ensureDisplaySettings();
  const prioritySectionEnabled = isPriorityMessagesEnabled(
    settings.enabledPanels,
  );
  const normalSectionEnabled = isNormalMessagesEnabled(settings.enabledPanels);

  const messages = await db.message.findMany({
    orderBy: [
      { priorityOrder: "asc" },
      { normalOrder: "asc" },
      { createdAt: "asc" },
    ],
  });

  if (prioritySectionEnabled) {
    const priorityMessages = messages
      .filter(
        (message) =>
          message.state === "PRIORITY" &&
          isMessageRotationEligible(message, now),
      )
      .map(serializeMessage);

    if (priorityMessages.length > 0) {
      return priorityMessages;
    }
  }

  if (!normalSectionEnabled) {
    return [];
  }

  return messages
    .filter(
      (message) =>
        message.state === "NON_PRIORITY" &&
        isMessageRotationEligible(message, now),
    )
    .map(serializeMessage);
}
