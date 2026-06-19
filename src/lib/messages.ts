import "server-only";

import type { Message, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { SerializedMessage } from "@/lib/message-types";
import type { SerializedDisplayNotice } from "@/lib/display-types";

export function serializeMessage(message: Message): SerializedMessage {
  return {
    id: message.id,
    title: message.title,
    body: message.body,
    state: message.state,
    status: message.status,
    includeInRotation: message.includeInRotation,
    startsAt: message.startsAt ? message.startsAt.toISOString() : null,
    endsAt: message.endsAt ? message.endsAt.toISOString() : null,
    durationSeconds: message.durationSeconds,
    priorityOrder: message.priorityOrder,
    normalOrder: message.normalOrder,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
  };
}

function messageEndInclusive(endAt: Date) {
  const end = new Date(endAt);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function isMessageWithinSchedule(
  message: Pick<Message, "startsAt" | "endsAt">,
  now = new Date(),
) {
  if (message.startsAt && message.startsAt > now) return false;
  if (message.endsAt && messageEndInclusive(message.endsAt) < now) return false;
  return true;
}

export function isMessageRotationEligible(
  message: Message,
  now = new Date(),
) {
  if (message.status !== "ACTIVE") return false;
  if (!message.includeInRotation) return false;
  return isMessageWithinSchedule(message, now);
}

export function messageToDisplayNotice(
  message: SerializedMessage,
): SerializedDisplayNotice {
  return {
    id: message.id,
    title: message.title,
    message: message.body,
    priority: message.state === "PRIORITY" ? "high" : "medium",
    startDate: message.startsAt,
    endDate: message.endsAt,
    createdAt: message.createdAt,
  };
}

export async function listAllMessages() {
  const messages = await db.message.findMany({
    orderBy: [
      { state: "asc" },
      { priorityOrder: "asc" },
      { normalOrder: "asc" },
      { createdAt: "desc" },
    ],
  });

  return messages.map(serializeMessage);
}

export async function createMessage(data: Prisma.MessageCreateInput) {
  const message = await db.message.create({ data });
  return serializeMessage(message);
}

export async function updateMessage(
  id: string,
  data: Prisma.MessageUpdateInput,
) {
  const message = await db.message.update({
    where: { id },
    data,
  });
  return serializeMessage(message);
}

export async function deleteMessage(id: string) {
  await db.message.delete({ where: { id } });
}

export async function updateMessageOrder(
  id: string,
  order: { priorityOrder?: number | null; normalOrder?: number | null },
) {
  const message = await db.message.update({
    where: { id },
    data: {
      ...(order.priorityOrder !== undefined
        ? { priorityOrder: order.priorityOrder }
        : {}),
      ...(order.normalOrder !== undefined
        ? { normalOrder: order.normalOrder }
        : {}),
    },
  });

  return serializeMessage(message);
}

export async function expireInactiveMessages() {
  const now = new Date();
  const expired = await db.message.findMany({
    where: {
      status: "ACTIVE",
      endsAt: { lt: now },
    },
  });

  return {
    expiredCount: expired.length,
    checkedAt: now.toISOString(),
  };
}
