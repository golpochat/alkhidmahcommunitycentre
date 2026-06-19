import type { MessageState } from "@prisma/client";

export function validateMessageScheduleValues(input: {
  state: MessageState;
  startsAt: Date | null;
  endsAt: Date | null;
}) {
  if (input.state === "PRIORITY") {
    if (!input.startsAt) {
      throw new Error("startsAt is required for PRIORITY messages");
    }
    if (!input.endsAt) {
      throw new Error("endsAt is required for PRIORITY messages");
    }
  }

  if (input.startsAt && input.endsAt && input.endsAt <= input.startsAt) {
    throw new Error("endsAt must be after startsAt");
  }
}
