export const TIMETABLE_HOME_PUBLISH_CHANGED_EVENT =
  "timetable-home-publish-changed";

export function notifyTimetableHomePublishChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TIMETABLE_HOME_PUBLISH_CHANGED_EVENT));
}
