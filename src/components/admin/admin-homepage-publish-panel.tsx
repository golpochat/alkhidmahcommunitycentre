"use client";

import { Globe, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export type HomepagePublishBadgeTone = "live" | "muted" | "warning";

interface AdminHomepagePublishPanelProps {
  title: string;
  description: string;
  checked: boolean;
  badgeLabel: string;
  badgeTone?: HomepagePublishBadgeTone;
  statusDetail: string;
  saving: boolean;
  publishDisabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const BADGE_TONE_CLASS: Record<HomepagePublishBadgeTone, string> = {
  live: "border-emerald/40 text-emerald",
  muted: "border-border text-muted-foreground",
  warning: "border-gold/40 text-gold",
};

export function AdminHomepagePublishPanel({
  title,
  description,
  checked,
  badgeLabel,
  badgeTone = "muted",
  statusDetail,
  saving,
  publishDisabled = false,
  onCheckedChange,
}: AdminHomepagePublishPanelProps) {
  return (
    <section className="rounded-lg border border-gold/25 bg-secondary/30 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Globe className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-base font-semibold">{title}</h3>
              <Badge
                variant="outline"
                className={cn("max-w-full text-balance", BADGE_TONE_CLASS[badgeTone])}
              >
                {badgeLabel}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            <p className="mt-2 text-sm text-foreground/85">{statusDetail}</p>
          </div>
        </div>

        <div className="admin-homepage-publish-control">
          <p className="admin-homepage-publish-control-label">Show on homepage</p>
          <div className="admin-messages-rotation-control">
            <Switch
              checked={checked}
              disabled={saving || publishDisabled}
              onCheckedChange={onCheckedChange}
              className="admin-homepage-publish-switch"
              aria-label={`${checked ? "Hide" : "Show"} ${title} on homepage`}
            />
            <span
              className={
                checked
                  ? "admin-homepage-publish-state admin-homepage-publish-state-on"
                  : "admin-homepage-publish-state"
              }
              aria-hidden="true"
            >
              {checked ? "On" : "Off"}
            </span>
          </div>
          {publishDisabled ? (
            <Button type="button" variant="outline" size="sm" disabled>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Load timetable first
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}