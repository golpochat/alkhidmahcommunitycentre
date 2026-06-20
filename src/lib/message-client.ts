import type { MessageState, MessageStatus } from "@prisma/client";
import type { SerializedMessage } from "@/lib/message-types";
import { nowIso, toDatetimeLocalValue } from "@/lib/events";
import {
  hasMessageScheduleEnded,
  isMessageWithinSchedule,
} from "@/lib/message-schedule";

export type MessageValidity =
  | "active_now"
  | "upcoming"
  | "expired"
  | "inactive"
  | "out_of_rotation";

export type MessageScheduleMode = "lifetime" | "limited";

export interface MessageFormState {
  title: string;
  body: string;
  state: MessageState;
  status: MessageStatus;
  includeInRotation: boolean;
  durationSeconds: number;
  scheduleMode: MessageScheduleMode;
  startsAt: string;
  endsAt: string;
  priorityOrder: string;
  normalOrder: string;
}

export interface MessageSectionFlags {
  priorityMessagesEnabled: boolean;
  normalMessagesEnabled: boolean;
}

export function isMessageOnTv(
  message: Pick<SerializedMessage, "status" | "includeInRotation">,
) {
  return message.status === "ACTIVE" && message.includeInRotation;
}

export function setMessageOnTv(
  form: MessageFormState,
  onTv: boolean,
): MessageFormState {
  return {
    ...form,
    status: onTv ? "ACTIVE" : "INACTIVE",
    includeInRotation: onTv,
  };
}

export function isMessageRotationEligible(
  message: SerializedMessage,
  now = new Date(),
) {
  if (message.status !== "ACTIVE") return false;
  if (!message.includeInRotation) return false;
  return isMessageWithinSchedule(message, now);
}

export function buildRotationQueue(
  messages: SerializedMessage[],
  now = new Date(),
  sections?: MessageSectionFlags,
): SerializedMessage[] {
  const priorityEnabled = sections?.priorityMessagesEnabled ?? true;
  const normalEnabled = sections?.normalMessagesEnabled ?? true;

  if (priorityEnabled) {
    const priorityMessages = sortMessagesByOrder(
      messages.filter(
        (message) =>
          message.state === "PRIORITY" &&
          isMessageRotationEligible(message, now),
      ),
    );

    if (priorityMessages.length > 0) {
      return priorityMessages;
    }
  }

  if (!normalEnabled) {
    return [];
  }

  return sortMessagesByOrder(
    messages.filter(
      (message) =>
        message.state === "NON_PRIORITY" &&
        isMessageRotationEligible(message, now),
    ),
  );
}

export function isMessageInRotationQueue(
  message: SerializedMessage,
  allMessages: SerializedMessage[],
  now = new Date(),
  sections?: MessageSectionFlags,
) {
  return buildRotationQueue(allMessages, now, sections).some(
    (queued) => queued.id === message.id,
  );
}

export function getMessageQueueExclusionReason(
  message: SerializedMessage,
  allMessages: SerializedMessage[],
  now = new Date(),
  sections?: MessageSectionFlags,
): string | null {
  if (isMessageInRotationQueue(message, allMessages, now, sections)) {
    return null;
  }

  if (
    message.state === "PRIORITY" &&
    sections &&
    !sections.priorityMessagesEnabled
  ) {
    return "Priority section off";
  }

  if (
    message.state === "NON_PRIORITY" &&
    sections &&
    !sections.normalMessagesEnabled
  ) {
    return "Normal section off";
  }

  if (!message.includeInRotation) {
    return "Rotation off";
  }

  if (message.status !== "ACTIVE") {
    return "Status inactive";
  }

  if (!isMessageWithinSchedule(message, now)) {
    const validity = getMessageValidity(message, now);
    if (validity === "expired") return "Schedule expired";
    if (validity === "upcoming") return "Not started yet";
    return "Outside schedule";
  }

  if (message.state === "NON_PRIORITY") {
    const priorityActive = allMessages.some(
      (item) =>
        item.state === "PRIORITY" && isMessageRotationEligible(item, now),
    );
    if (priorityActive) {
      return "Priority messages active";
    }
  }

  return "Not eligible";
}

export function getMessageShowsLabel(
  message: SerializedMessage,
  allMessages: SerializedMessage[],
  now = new Date(),
  sections?: MessageSectionFlags,
): string {
  if (
    message.state === "PRIORITY" &&
    sections &&
    !sections.priorityMessagesEnabled
  ) {
    return "Section off";
  }

  if (
    message.state === "NON_PRIORITY" &&
    sections &&
    !sections.normalMessagesEnabled
  ) {
    return "Section off";
  }

  if (message.status === "INACTIVE" || !message.includeInRotation) {
    return "Off";
  }

  const validity = getMessageValidity(message, now);
  if (validity === "expired") return "Expired";
  if (validity === "upcoming") return "Scheduled";

  if (isMessageInRotationQueue(message, allMessages, now, sections)) {
    return "Live now";
  }

  if (message.state === "NON_PRIORITY") {
    const priorityActive = allMessages.some(
      (item) =>
        item.state === "PRIORITY" && isMessageRotationEligible(item, now),
    );
    if (priorityActive) return "Waiting";
  }

  return "Off";
}

export function getMessageValidity(
  message: SerializedMessage,
  now = new Date(),
): MessageValidity {
  if (message.status === "INACTIVE") return "inactive";
  if (!message.includeInRotation) return "out_of_rotation";

  const startsAt = message.startsAt ? new Date(message.startsAt) : null;

  if (hasMessageScheduleEnded(message, now)) return "expired";
  if (startsAt && startsAt > now) return "upcoming";
  return "active_now";
}

export function createEmptyMessageForm(): MessageFormState {
  const now = toDatetimeLocalValue(nowIso());
  return {
    title: "",
    body: "",
    state: "NON_PRIORITY",
    status: "ACTIVE",
    includeInRotation: true,
    durationSeconds: 15,
    scheduleMode: "lifetime",
    startsAt: now,
    endsAt: now,
    priorityOrder: "",
    normalOrder: "",
  };
}

export function messageToForm(message: SerializedMessage): MessageFormState {
  const hasLimitedSchedule =
    message.state === "NON_PRIORITY" &&
    Boolean(message.startsAt || message.endsAt);

  return {
    title: message.title,
    body: message.body,
    state: message.state,
    status: message.status,
    includeInRotation: message.includeInRotation,
    durationSeconds: message.durationSeconds,
    scheduleMode: hasLimitedSchedule ? "limited" : "lifetime",
    startsAt: message.startsAt
      ? toDatetimeLocalValue(message.startsAt)
      : toDatetimeLocalValue(nowIso()),
    endsAt: message.endsAt
      ? toDatetimeLocalValue(message.endsAt)
      : toDatetimeLocalValue(nowIso()),
    priorityOrder:
      message.priorityOrder != null ? String(message.priorityOrder) : "",
    normalOrder: message.normalOrder != null ? String(message.normalOrder) : "",
  };
}

export function sortMessagesByOrder(messages: SerializedMessage[]) {
  return [...messages].sort((a, b) => {
    const aOrder =
      a.state === "PRIORITY" ? a.priorityOrder ?? 9999 : a.normalOrder ?? 9999;
    const bOrder =
      b.state === "PRIORITY" ? b.priorityOrder ?? 9999 : b.normalOrder ?? 9999;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export function nextOrderForState(
  messages: SerializedMessage[],
  state: MessageState,
) {
  const sameState = messages.filter((message) => message.state === state);
  const orders = sameState.map((message) =>
    state === "PRIORITY" ? message.priorityOrder : message.normalOrder,
  );
  const max = orders.reduce<number>(
    (current, value) => (value != null && value > current ? value : current),
    -1,
  );
  return max + 1;
}

export function formToApiPayload(
  form: MessageFormState,
  messages: SerializedMessage[],
  editingId?: string | null,
) {
  const nextPriorityOrder =
    form.priorityOrder.trim() !== ""
      ? Number(form.priorityOrder)
      : nextOrderForState(
          messages.filter((message) => message.id !== editingId),
          "PRIORITY",
        );

  const nextNormalOrder =
    form.normalOrder.trim() !== ""
      ? Number(form.normalOrder)
      : nextOrderForState(
          messages.filter((message) => message.id !== editingId),
          "NON_PRIORITY",
        );

  const base = {
    title: form.title.trim(),
    body: form.body.trim(),
    state: form.state,
    status: form.status,
    includeInRotation: form.includeInRotation,
    durationSeconds: form.durationSeconds,
    priorityOrder: form.state === "PRIORITY" ? nextPriorityOrder : null,
    normalOrder: form.state === "NON_PRIORITY" ? nextNormalOrder : null,
  };

  if (form.state === "PRIORITY") {
    return {
      ...base,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
    };
  }

  if (form.scheduleMode === "lifetime") {
    return {
      ...base,
      startsAt: null,
      endsAt: null,
    };
  }

  return {
    ...base,
    startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
    endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
  };
}

export function formatMessageSchedule(
  message: SerializedMessage,
  now = new Date(),
) {
  if (!message.endsAt) {
    return "No end date";
  }

  if (hasMessageScheduleEnded(message, now)) {
    return "Expired";
  }

  return new Date(message.endsAt).toLocaleString("en-IE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export type RotationSource =
  | "priority"
  | "non_priority"
  | "ayat";

export function resolveRotationSource(
  queue: SerializedMessage[],
): RotationSource {
  if (!queue.length) return "ayat";
  return queue[0].state === "PRIORITY" ? "priority" : "non_priority";
}

export function rotationSourceLabel(source: RotationSource) {
  switch (source) {
    case "priority":
      return "Priority rotation";
    case "non_priority":
      return "Non-priority rotation";
    default:
      return "Ayat & Hadith rotation";
  }
}
