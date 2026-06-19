import "server-only";

import { db } from "@/lib/db";
import {
  isMessageRotationEligible,
  serializeMessage,
} from "@/lib/messages";
import type { SerializedMessage } from "@/lib/message-types";

export async function getRotationQueue(now = new Date()): Promise<SerializedMessage[]> {
  const messages = await db.message.findMany({
    orderBy: [
      { priorityOrder: "asc" },
      { normalOrder: "asc" },
      { createdAt: "asc" },
    ],
  });

  const priorityMessages = messages
    .filter(
      (message) =>
        message.state === "PRIORITY" && isMessageRotationEligible(message, now),
    )
    .map(serializeMessage);

  if (priorityMessages.length > 0) {
    return priorityMessages;
  }

  const nonPriorityMessages = messages
    .filter(
      (message) =>
        message.state === "NON_PRIORITY" &&
        isMessageRotationEligible(message, now),
    )
    .map(serializeMessage);

  return nonPriorityMessages;
}
