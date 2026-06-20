import { describe, expect, it } from "vitest";
import { formatMessageSchedule } from "@/lib/message-client";
import {
  hasMessageScheduleEnded,
  isMessageWithinSchedule,
} from "@/lib/message-schedule";
import type { SerializedMessage } from "@/lib/message-types";

describe("message schedule expiry", () => {
  const startsAt = "2026-06-20T06:00:00.000Z";
  const endsAt = "2026-06-20T07:25:00.000Z";

  it("treats a message as active before the exact end time", () => {
    const now = new Date("2026-06-20T07:24:59.000Z");

    expect(
      isMessageWithinSchedule({ startsAt, endsAt }, now),
    ).toBe(true);
    expect(hasMessageScheduleEnded({ endsAt }, now)).toBe(false);
  });

  it("expires a message at the exact end time", () => {
    const now = new Date("2026-06-20T07:25:00.000Z");

    expect(
      isMessageWithinSchedule({ startsAt, endsAt }, now),
    ).toBe(false);
    expect(hasMessageScheduleEnded({ endsAt }, now)).toBe(true);
  });

  it("expires a message after the scheduled end time", () => {
    const now = new Date("2026-06-20T07:25:25.000Z");

    expect(
      isMessageWithinSchedule({ startsAt, endsAt }, now),
    ).toBe(false);
    expect(hasMessageScheduleEnded({ endsAt }, now)).toBe(true);
  });

  it("does not extend expiry to the end of the calendar day", () => {
    const now = new Date("2026-06-20T12:00:00.000Z");

    expect(
      isMessageWithinSchedule({ startsAt, endsAt }, now),
    ).toBe(false);
  });
});

function scheduleMessage(overrides: Partial<SerializedMessage> = {}): SerializedMessage {
  return {
    id: "msg-1",
    title: "Test",
    body: "Body",
    state: "NON_PRIORITY",
    status: "ACTIVE",
    includeInRotation: true,
    durationSeconds: 15,
    startsAt: "2026-06-20T06:00:00.000Z",
    endsAt: "2026-06-20T07:25:00.000Z",
    priorityOrder: null,
    normalOrder: null,
    createdAt: "2026-06-20T05:00:00.000Z",
    updatedAt: "2026-06-20T05:00:00.000Z",
    ...overrides,
  };
}

describe("formatMessageSchedule", () => {
  it('shows "Expired" when the end time has passed', () => {
    const message = scheduleMessage();
    const now = new Date("2026-06-20T07:25:00.000Z");

    expect(formatMessageSchedule(message, now)).toBe("Expired");
  });

  it("shows only the end date and time when still active", () => {
    const message = scheduleMessage();
    const now = new Date("2026-06-20T07:00:00.000Z");

    expect(formatMessageSchedule(message, now)).toBe(
      new Date(message.endsAt!).toLocaleString("en-IE", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    );
  });

  it('shows "No end date" for lifetime messages', () => {
    const message = scheduleMessage({ startsAt: null, endsAt: null });

    expect(formatMessageSchedule(message)).toBe("No end date");
  });
});
