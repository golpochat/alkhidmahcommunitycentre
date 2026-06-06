"use client";

import { useEffect, useMemo, useState } from "react";
import type { SerializedDisplayNotice } from "@/lib/display-types";

interface AnnouncementsPanelProps {
  notices: SerializedDisplayNotice[];
  rotationSpeed?: number;
}

export function AnnouncementsPanel({
  notices,
  rotationSpeed = 10,
}: AnnouncementsPanelProps) {
  const items = useMemo(
    () => notices.filter((notice) => notice.priority !== "high"),
    [notices]
  );
  const itemsKey = useMemo(() => items.map((item) => item.id).join("|"), [items]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [itemsKey]);

  useEffect(() => {
    if (items.length <= 1) return;

    const intervalMs = Math.max(5, rotationSpeed) * 1000;
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [items.length, rotationSpeed, itemsKey]);

  if (!items.length) {
    return (
      <div className="display-rotating-panel display-rotating-panel-empty">
        <h3 className="display-rotating-panel-title">Announcements</h3>
        <p className="display-rotating-panel-empty-text">No announcements at this time</p>
      </div>
    );
  }

  const notice = items[activeIndex % items.length];

  return (
    <div className="display-rotating-panel">
      <h3 className="display-rotating-panel-title">Announcements</h3>
      <article className="display-announcement-feature">
        <span
          className={`display-announcement-priority display-announcement-priority-${notice.priority}`}
        >
          {notice.priority}
        </span>
        <p className="display-announcement-title">{notice.title}</p>
        <p className="display-announcement-message">{notice.message}</p>
      </article>
      {items.length > 1 && (
        <div className="display-announcement-dots">
          {items.map((item, index) => (
            <span
              key={item.id}
              className={`display-announcement-dot${index === activeIndex ? " display-announcement-dot-active" : ""}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
