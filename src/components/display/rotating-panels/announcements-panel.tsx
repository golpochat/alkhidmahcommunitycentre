import {
  SeasonalPanelMessageBlock,
  type SeasonalPanelMessage,
} from "@/components/display/seasonal-banner";
import type { SerializedDisplayNotice } from "@/lib/display-types";

interface AnnouncementsPanelProps {
  notices: SerializedDisplayNotice[];
  seasonalMessage?: SeasonalPanelMessage | null;
}

export function AnnouncementsPanel({
  notices,
  seasonalMessage = null,
}: AnnouncementsPanelProps) {
  const items = notices.filter((notice) => notice.priority !== "high");

  if (!items.length && !seasonalMessage) {
    return (
      <div className="display-rotating-panel display-rotating-panel-empty">
        <h3 className="display-rotating-panel-title">Announcements</h3>
        <p className="display-rotating-panel-empty-text">No announcements at this time</p>
      </div>
    );
  }

  return (
    <div className="display-rotating-panel">
      <h3 className="display-rotating-panel-title">Announcements</h3>
      {seasonalMessage && <SeasonalPanelMessageBlock message={seasonalMessage} />}
      {items.length > 0 && (
        <ul className="display-announcements-list">
          {items.slice(0, 4).map((notice) => (
            <li key={notice.id} className="display-announcement-item">
              <span
                className={`display-announcement-priority display-announcement-priority-${notice.priority}`}
              >
                {notice.priority}
              </span>
              <div>
                <p className="display-announcement-title">{notice.title}</p>
                <p className="display-announcement-message">{notice.message}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
