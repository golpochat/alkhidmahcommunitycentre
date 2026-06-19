"use client";

import { useCallback, useEffect, useState } from "react";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { TIMETABLE_HOME_PUBLISH_CHANGED_EVENT } from "@/lib/timetable-home-publish-events";

interface MonthlyPublishState {
  published: boolean;
  month: number | null;
  year: number | null;
  hasData: boolean;
}

interface RamadanPublishState {
  published: boolean;
  year: number | null;
  hasData: boolean;
}

export interface TimetableHomePublishOverview {
  sectionVisible: boolean;
  monthly: MonthlyPublishState;
  ramadan: RamadanPublishState;
}

const EMPTY_OVERVIEW: TimetableHomePublishOverview = {
  sectionVisible: true,
  monthly: {
    published: false,
    month: null,
    year: null,
    hasData: false,
  },
  ramadan: {
    published: false,
    year: null,
    hasData: false,
  },
};

export function useTimetableHomePublishOverview() {
  const [overview, setOverview] =
    useState<TimetableHomePublishOverview>(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/timetable-home-publish");
      const data = await parseJsonResponse<TimetableHomePublishOverview>(response);
      if (!response.ok) return;
      setOverview(data);
    } catch {
      // keep last known state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const handleChange = () => {
      void reload();
    };

    window.addEventListener(TIMETABLE_HOME_PUBLISH_CHANGED_EVENT, handleChange);
    return () => {
      window.removeEventListener(TIMETABLE_HOME_PUBLISH_CHANGED_EVENT, handleChange);
    };
  }, [reload]);

  return { overview, loading, reload };
}
