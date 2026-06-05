"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrayerTimesDisplay } from "@/components/prayer-times/prayer-times-display";
import {
  PrayerTimesClockHeader,
  PrayerTimesCountdownFooter,
} from "@/components/prayer-times/prayer-times-live-status";
import { SITE_NAME } from "@/lib/constants";
import type { PrayerTimesResponse } from "@/lib/prayer-times-client";
import { withJumuahTablePreview } from "@/lib/prayer-times-client";

export function PrayerTimesWidget() {
  const [schedule, setSchedule] = useState<PrayerTimesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPrayerTimes = useCallback(async () => {
    try {
      const response = await fetch("/api/prayer-times", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch prayer times");
      const data: PrayerTimesResponse = await response.json();
      setSchedule(data);
      setError("");
    } catch {
      setError(
        "Unable to load prayer times right now. Please refresh the page or visit the centre for today's schedule."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrayerTimes();
    const interval = setInterval(fetchPrayerTimes, 60_000);
    return () => clearInterval(interval);
  }, [fetchPrayerTimes]);

  const displaySchedule = useMemo(() => {
    if (!schedule) return null;
    return process.env.NEXT_PUBLIC_PREVIEW_JUMUAH === "true"
      ? withJumuahTablePreview(schedule)
      : schedule;
  }, [schedule]);

  return (
    <section id="prayer-times" className="section-padding bg-secondary/50">
      <div className="section-container">
        <div className="mb-10 text-center">
          <Badge variant="outline" className="mb-4 border-gold text-gold">
            Live Prayer Times
          </Badge>
          <h2 className="heading-section mb-3">Today&apos;s Salah Times</h2>
        </div>

        <Card className="mx-auto max-w-4xl border-gold/20 shadow-gold">
          <CardHeader className="pb-0 text-center">
            <CardTitle className="font-heading text-xl md:text-2xl">
              {SITE_NAME} Prayer Timetable
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
              </div>
            )}

            {error && (
              <p className="py-8 text-center text-muted-foreground">{error}</p>
            )}

            {!loading && !error && schedule && displaySchedule && (
              <>
                {schedule.degraded && schedule.warning && (
                  <p className="mb-4 text-center text-sm text-amber-600 dark:text-amber-400">
                    {schedule.warning}
                  </p>
                )}
                <PrayerTimesClockHeader
                  englishDate={displaySchedule.englishDate}
                  hijriDate={displaySchedule.hijriDate}
                />
                <PrayerTimesDisplay schedule={displaySchedule} />
                <PrayerTimesCountdownFooter schedule={displaySchedule} />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
