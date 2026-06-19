"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AdminHomepagePublishPanel } from "@/components/admin/admin-homepage-publish-panel";
import { useTimetableHomePublishOverview } from "@/hooks/use-timetable-home-publish-overview";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { notifyTimetableHomePublishChanged } from "@/lib/timetable-home-publish-events";

export function AdminPrayerTimetablesHomeSectionPanel() {
  const { overview } = useTimetableHomePublishOverview();
  const [saving, setSaving] = useState(false);

  async function handleVisibleChange(nextVisible: boolean) {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/timetable-home-banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: nextVisible }),
      });
      const data = await parseJsonResponse<{ error?: string; visible?: boolean }>(
        response,
      );
      if (!response.ok) {
        throw new Error(data.error || "Failed to update homepage section");
      }

      notifyTimetableHomePublishChanged();
      toast.success(
        nextVisible
          ? "Prayer timetables section enabled on the homepage"
          : "Prayer timetables section hidden from the homepage",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update homepage section",
      );
    } finally {
      setSaving(false);
    }
  }

  const sectionVisible = overview.sectionVisible;
  const monthlyLive = overview.monthly.published && overview.sectionVisible;
  const ramadanLive = overview.ramadan.published && overview.sectionVisible;

  return (
    <AdminHomepagePublishPanel
      title="Prayer timetables section"
      description="Master switch for the homepage download bar. Individual Ramadan and monthly links are controlled in their tabs."
      checked={sectionVisible}
      badgeLabel={
        sectionVisible
          ? monthlyLive || ramadanLive
            ? "Live on homepage"
            : "Section enabled"
          : "Hidden from homepage"
      }
      badgeTone={sectionVisible && (monthlyLive || ramadanLive) ? "live" : "muted"}
      statusDetail={
        sectionVisible
          ? monthlyLive || ramadanLive
            ? "At least one timetable link is currently visible on the homepage."
            : "The section is enabled, but no timetable links are published yet."
          : "The entire prayer timetables bar is hidden on the homepage."
      }
      saving={saving}
      onCheckedChange={(next) => void handleVisibleChange(next)}
    />
  );
}
