type MessageScheduleFields = {
  startsAt?: string | Date | null;
  endsAt?: string | Date | null;
};

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function isMessageWithinSchedule(
  message: MessageScheduleFields,
  now = new Date(),
) {
  if (message.startsAt && toDate(message.startsAt) > now) {
    return false;
  }

  if (message.endsAt && toDate(message.endsAt) <= now) {
    return false;
  }

  return true;
}

export function hasMessageScheduleEnded(
  message: MessageScheduleFields,
  now = new Date(),
) {
  return Boolean(message.endsAt && toDate(message.endsAt) <= now);
}
