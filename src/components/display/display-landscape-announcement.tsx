"use client";

import { useEffect, useMemo, useState } from "react";
import type { SerializedDisplayNotice } from "@/lib/display-types";
import {
  filterActiveDisplayNotices,
  findActivePriorityNotice,
} from "@/lib/display-notices";

interface DisplayLandscapeAnnouncementProps {
  notices: SerializedDisplayNotice[];
  rotationSpeed?: number;
  now?: Date | null;
}

export function DisplayLandscapeAnnouncement({
  notices,
  rotationSpeed = 10,
  now = null,
}: DisplayLandscapeAnnouncementProps) {
  const effectiveNow = now ?? new Date();
  const priorityNotice = useMemo(
    () => findActivePriorityNotice(notices, effectiveNow),
    [notices, effectiveNow]
  );

  const items = useMemo(
    () =>
      filterActiveDisplayNotices(notices, effectiveNow).filter(
        (notice) => notice.priority !== "high"
      ),
    [notices, effectiveNow]
  );
  const itemsKey = useMemo(() => items.map((item) => item.id).join("|"), [items]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [itemsKey]);

  useEffect(() => {
    if (priorityNotice || items.length <= 1) return;

    const intervalMs = Math.max(5, rotationSpeed) * 1000;
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [items.length, rotationSpeed, itemsKey, priorityNotice]);

  if (priorityNotice) {
    return (
      <article className="display-landscape-announcement-block display-landscape-announcement-priority">
        <p className="display-landscape-announcement-kicker">Important Notice</p>
        <p className="display-landscape-announcement-title">
          {priorityNotice.title}
        </p>
        <p className="display-landscape-announcement-message">
          {priorityNotice.message}
        </p>
      </article>
    );
  }

  const notice = items.length ? items[activeIndex % items.length] : null;

  return (
    <article className="display-landscape-announcement-block">
      <p className="display-landscape-announcement-title">
        {notice?.title ?? "Announcements"}
      </p>
      <p className="display-landscape-announcement-message">
        {notice?.message ?? "No announcements at this time"}
      </p>
    </article>
  );
}
