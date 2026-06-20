import type { SerializedDisplayNotice } from "@/lib/display-types";
import { isMessageWithinSchedule } from "@/lib/message-schedule";

export function isDisplayNoticeActive(
  notice: SerializedDisplayNotice,
  now = new Date(),
) {
  return isMessageWithinSchedule(
    {
      startsAt: notice.startDate,
      endsAt: notice.endDate,
    },
    now,
  );
}

export function filterActiveDisplayNotices(
  notices: SerializedDisplayNotice[],
  now = new Date()
) {
  return notices.filter((notice) => isDisplayNoticeActive(notice, now));
}

export function findActivePriorityNotice(
  notices: SerializedDisplayNotice[],
  now = new Date()
) {
  return (
    filterActiveDisplayNotices(notices, now).find(
      (notice) => notice.priority === "high"
    ) ?? null
  );
}
