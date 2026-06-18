import type { SerializedDisplayNotice } from "@/lib/display-types";

function noticeEndInclusive(endDate: string) {
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function isDisplayNoticeActive(
  notice: SerializedDisplayNotice,
  now = new Date(),
) {
  if (notice.startDate && new Date(notice.startDate) > now) return false;
  if (notice.endDate && noticeEndInclusive(notice.endDate) < now) return false;
  return true;
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
