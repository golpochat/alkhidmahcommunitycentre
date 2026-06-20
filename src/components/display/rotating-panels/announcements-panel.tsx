"use client";

import { useEffect, useMemo, useState } from "react";
import { DisplayLandscapePanelShell } from "@/components/display/display-landscape-panel-shell";
import type { SerializedDisplayNotice } from "@/lib/display-types";
import { filterActiveDisplayNotices } from "@/lib/display-notices";

interface AnnouncementsPanelProps {
  notices: SerializedDisplayNotice[];
  rotationSpeed?: number;
  hideDots?: boolean;
  variant?: "default" | "landscape";
}

function formatPriorityLabel(priority: string) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function AnnouncementsPanel({
  notices,
  rotationSpeed = 10,
  hideDots = false,
  variant = "default",
}: AnnouncementsPanelProps) {
  const items = useMemo(
    () =>
      filterActiveDisplayNotices(notices).filter(
        (notice) => notice.priority !== "high",
      ),
    [notices],
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
    if (variant === "landscape") {
      return (
        <DisplayLandscapePanelShell>
          <p className="display-landscape-panel-empty">No announcements at this time</p>
        </DisplayLandscapePanelShell>
      );
    }

    return (
      <div className="display-rotating-panel display-rotating-panel-empty">
        <p className="display-rotating-panel-empty-text">No announcements at this time</p>
      </div>
    );
  }

  const notice = items[activeIndex % items.length];

  if (variant === "landscape") {
    return (
      <DisplayLandscapePanelShell>
        <p className="display-landscape-panel-headline">
          <span className="display-landscape-panel-emphasis">{notice.title}</span>
          <span className="display-landscape-panel-separator"> · </span>
          <span className="display-landscape-panel-detail">{notice.message}</span>
        </p>
      </DisplayLandscapePanelShell>
    );
  }

  return (
    <div className="display-rotating-panel">
      <article className="display-announcement-feature">
        <span
          className={`display-announcement-priority display-announcement-priority-${notice.priority}`}
        >
          {formatPriorityLabel(notice.priority)}
        </span>
        <p className="display-announcement-title">{notice.title}</p>
        <p className="display-announcement-message">{notice.message}</p>
      </article>
      {items.length > 1 && !hideDots && (
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
