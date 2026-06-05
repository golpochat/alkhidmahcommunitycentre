"use client";

import { useEffect, useMemo, useState } from "react";
import { format, nextFriday, parseISO } from "date-fns";
import { Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  buildAdminFormDefaults,
  DEFAULT_EID_ADHA_TIMES,
  DEFAULT_EID_FITR_TIMES,
  defaultJumuahAdminSlots,
  getEidPrayerLabel,
  getJumuahPrayerLabel,
  isFriday,
  jumuahSlotsFromRecord,
  type JumuahAdminSlot,
} from "@/lib/prayer-times-client";
import {
  defaultAdhanConfig,
  defaultAdhanConfigEntry,
  inferAdhanConfigFromLegacy,
  type DailyAdhanConfig,
  type PrayerAdhanConfig,
} from "@/lib/prayer-adhan";
import {
  defaultIqamaConfig,
  defaultIqamaConfigEntry,
  type DailyIqamaConfig,
  type DailyPrayerKey,
  type PrayerIqamaConfig,
} from "@/lib/prayer-iqama";
import {
  AdminAdhanApiTime,
  AdminAdhanField,
} from "@/components/admin/admin-adhan-offset-field";
import { AdminIqamaField } from "@/components/admin/admin-iqama-field";
import { AdminMonthlyTimetableTab } from "@/components/admin/admin-monthly-timetable-tab";
import { AdminRamadanTimetableTab } from "@/components/admin/admin-ramadan-timetable-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { PrayerTimesResponse } from "@/lib/prayer-times-client";
import type { PrayerTimesOverrideRecord } from "@/types";

type OverrideSection = "daily" | "jumuah" | "eid";

function TabActions({
  saving,
  disabled,
  onSave,
  onReset,
}: {
  saving: boolean;
  disabled?: boolean;
  onSave: () => void;
  onReset?: () => void;
}) {
  return (
    <div className="admin-prayer-times-tab-actions">
      <Button
        type="button"
        className="btn-gold"
        disabled={saving || disabled}
        onClick={onSave}
      >
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <Save className="mr-2 h-4 w-4" />
        Save
      </Button>
      {onReset && (
        <Button
          type="button"
          variant="outline"
          disabled={saving || disabled}
          onClick={onReset}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>
      )}
    </div>
  );
}

const DAILY_PRAYERS = [
  { key: "fajr", label: "Fajr" },
  { key: "dhuhr", label: "Dhuhr" },
  { key: "asr", label: "Asr" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isha", label: "Isha" },
] as const satisfies ReadonlyArray<{ key: DailyPrayerKey; label: string }>;

const LAST_EID_TYPE_KEY = "prayer-times-last-eid-type";

interface AdminFormState {
  date: string;
  apiAdhan: Record<DailyPrayerKey, string>;
  adhanConfig: DailyAdhanConfig;
  fajrIqama: string;
  dhuhrIqama: string;
  asrIqama: string;
  maghribIqama: string;
  ishaIqama: string;
  iqamaConfig: DailyIqamaConfig;
}

const emptyForm: AdminFormState = {
  date: "",
  apiAdhan: {
    fajr: "",
    dhuhr: "",
    asr: "",
    maghrib: "",
    isha: "",
  },
  adhanConfig: defaultAdhanConfig(),
  fajrIqama: "",
  dhuhrIqama: "",
  asrIqama: "",
  maghribIqama: "",
  ishaIqama: "",
  iqamaConfig: defaultIqamaConfig(),
};

function todayDateKey() {
  return format(new Date(), "yyyy-MM-dd");
}

function readLastEidType(): "FITR" | "ADHA" {
  if (typeof window === "undefined") return "ADHA";
  const stored = window.localStorage.getItem(LAST_EID_TYPE_KEY);
  return stored === "FITR" ? "FITR" : "ADHA";
}

function writeLastEidType(type: "FITR" | "ADHA") {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_EID_TYPE_KEY, type);
}

function defaultEidPrayersForType(eidType: "FITR" | "ADHA") {
  const source =
    eidType === "FITR" ? DEFAULT_EID_FITR_TIMES : DEFAULT_EID_ADHA_TIMES;
  return source.map((item) => ({ index: item.index, time: item.iqama }));
}

function eidPrayersFromRecord(
  record: PrayerTimesOverrideRecord | null,
  eidType: "FITR" | "ADHA",
) {
  if (record?.eidPrayers?.length && record.eidType === eidType) {
    return record.eidPrayers.map((item) => ({
      index: item.index,
      time: item.time || "",
    }));
  }

  return defaultEidPrayersForType(eidType);
}

function apiAdhanFromDefaults(
  defaults: PrayerTimesResponse,
): Record<DailyPrayerKey, string> {
  return {
    fajr: defaults.prayers.fajr.adhan || "",
    dhuhr: defaults.prayers.dhuhr?.adhan || "",
    asr: defaults.prayers.asr.adhan || "",
    maghrib: defaults.prayers.maghrib.adhan || "",
    isha: defaults.prayers.isha.adhan || "",
  };
}

function mergeDailyFormWithDefaults(
  defaults: PrayerTimesResponse,
  override: PrayerTimesOverrideRecord | null,
): AdminFormState {
  const apiAdhan = apiAdhanFromDefaults(defaults);
  const base = buildAdminFormDefaults(defaults, null, []);

  if (!override) {
    return {
      date: base.date,
      apiAdhan,
      adhanConfig: defaultAdhanConfig(),
      fajrIqama: base.fajrIqama,
      dhuhrIqama: base.dhuhrIqama,
      asrIqama: base.asrIqama,
      maghribIqama: base.maghribIqama,
      ishaIqama: base.ishaIqama,
      iqamaConfig: base.iqamaConfig,
    };
  }

  const adhanConfig = override.adhanConfig
    ? { ...defaultAdhanConfig(), ...override.adhanConfig }
    : inferAdhanConfigFromLegacy(override, apiAdhan);

  return {
    date: base.date,
    apiAdhan,
    adhanConfig,
    fajrIqama: override.fajrIqama || base.fajrIqama,
    dhuhrIqama: override.dhuhrIqama || base.dhuhrIqama,
    asrIqama: override.asrIqama || base.asrIqama,
    maghribIqama: override.maghribIqama || base.maghribIqama,
    ishaIqama: override.ishaIqama || base.ishaIqama,
    iqamaConfig: override.iqamaConfig ?? base.iqamaConfig,
  };
}

function applyEidType(
  eidType: "FITR" | "ADHA",
  currentPrayers: Array<{ index: number; time: string }>,
  previousType: "FITR" | "ADHA",
) {
  writeLastEidType(eidType);

  return {
    eidType,
    eidPrayers:
      currentPrayers.length > 0 && previousType === eidType
        ? currentPrayers
        : defaultEidPrayersForType(eidType),
  };
}

export function AdminPrayerTimesManager() {
  const [selectedDate, setSelectedDate] = useState(todayDateKey);
  const [eidDate, setEidDate] = useState(todayDateKey);
  const [eidType, setEidType] = useState<"FITR" | "ADHA">("ADHA");
  const [eidPrayers, setEidPrayers] = useState<
    Array<{ index: number; time: string }>
  >(() => defaultEidPrayersForType("ADHA"));
  const [form, setForm] = useState<AdminFormState>(emptyForm);
  const [jumuahSlots, setJumuahSlots] = useState<JumuahAdminSlot[]>(
    defaultJumuahAdminSlots,
  );
  const [formLoading, setFormLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<OverrideSection | null>(
    null,
  );
  const [reloadKey, setReloadKey] = useState(0);

  const jumuahDate = useMemo(
    () => format(nextFriday(new Date()), "yyyy-MM-dd"),
    [],
  );

  const selectedFriday = useMemo(() => {
    if (!selectedDate) return false;
    return isFriday(parseISO(selectedDate));
  }, [selectedDate]);

  useEffect(() => {
    const date = selectedDate || todayDateKey();

    async function loadDateData() {
      setFormLoading(true);
      try {
        const response = await fetch(`/api/admin/prayer-times?date=${date}`);
        if (!response.ok) throw new Error("Failed");

        const data = await response.json();
        setForm(mergeDailyFormWithDefaults(data.defaults, data.override));
      } catch {
        toast.error("Failed to load prayer times for this date");
        setForm({ ...emptyForm, date });
      } finally {
        setFormLoading(false);
      }
    }

    loadDateData();
  }, [selectedDate, reloadKey]);

  useEffect(() => {
    async function loadActiveEid() {
      try {
        const response = await fetch(
          `/api/admin/prayer-times?date=${todayDateKey()}`,
        );
        if (!response.ok) return;

        const data = await response.json();
        if (data.activeEid?.eidType) {
          const activeType = data.activeEid.eidType as "FITR" | "ADHA";
          setEidDate(data.activeEid.date);
          setEidType(activeType);
          setEidPrayers(eidPrayersFromRecord(data.activeEid, activeType));
          writeLastEidType(activeType);
          return;
        }

        const lastType = readLastEidType();
        setEidType(lastType);
        setEidPrayers(defaultEidPrayersForType(lastType));
      } catch {
        // Keep the current Eid form state if the active config cannot be loaded.
      }
    }

    loadActiveEid();
  }, [reloadKey]);

  useEffect(() => {
    async function loadActiveJumuah() {
      try {
        const response = await fetch(
          `/api/admin/prayer-times?date=${todayDateKey()}`,
        );
        if (!response.ok) return;

        const data = await response.json();
        if (selectedFriday && data.override?.jumuah?.length) {
          setJumuahSlots(jumuahSlotsFromRecord(data.override));
          return;
        }

        setJumuahSlots(jumuahSlotsFromRecord(data.activeJumuah ?? null));
      } catch {
        setJumuahSlots(defaultJumuahAdminSlots());
      }
    }

    loadActiveJumuah();
  }, [reloadKey, selectedFriday, selectedDate]);

  function updateAdhanConfig(
    prayer: DailyPrayerKey,
    config: PrayerAdhanConfig,
  ) {
    setForm((current) => ({
      ...current,
      adhanConfig: {
        ...current.adhanConfig,
        [prayer]: config,
      },
    }));
  }

  function updateIqamaConfig(
    prayer: DailyPrayerKey,
    config: PrayerIqamaConfig,
  ) {
    setForm((current) => ({
      ...current,
      iqamaConfig: {
        ...current.iqamaConfig,
        [prayer]: config,
      },
    }));
  }

  function addJumuah() {
    setJumuahSlots((current) => [
      ...current,
      { index: current.length + 1, adhan: "", iqama: "" },
    ]);
  }

  function removeJumuah(index: number) {
    setJumuahSlots((current) =>
      current
        .filter((item) => item.index !== index)
        .map((item, idx) => ({ ...item, index: idx + 1 })),
    );
  }

  function addEidPrayer() {
    setEidPrayers((current) => [
      ...current,
      { index: current.length + 1, time: "" },
    ]);
  }

  function removeEidPrayer(index: number) {
    setEidPrayers((current) =>
      current
        .filter((item) => item.index !== index)
        .map((item, idx) => ({ ...item, index: idx + 1 })),
    );
  }

  function selectEidType(nextType: "FITR" | "ADHA") {
    const next = applyEidType(nextType, eidPrayers, eidType);
    setEidType(next.eidType);
    setEidPrayers(next.eidPrayers);
  }

  async function postOverride(payload: Record<string, unknown>) {
    const response = await fetch("/api/admin/prayer-times", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Save failed");
    }
  }

  async function saveSection(section: OverrideSection) {
    if (section === "daily" && !selectedDate) {
      toast.error("Please select a date");
      return;
    }

    if (section === "eid" && !eidDate) {
      toast.error("Please select an Eid date");
      return;
    }

    setSavingSection(section);
    try {
      if (section === "daily") {
        await postOverride({
          section: "daily",
          date: selectedDate,
          adhanConfig: form.adhanConfig,
          iqamaConfig: form.iqamaConfig,
          fajrAdhan: null,
          dhuhrAdhan: null,
          asrAdhan: null,
          maghribAdhan: null,
          ishaAdhan: null,
          fajrIqama: form.fajrIqama,
          dhuhrIqama: form.dhuhrIqama,
          asrIqama: form.asrIqama,
          maghribIqama: form.maghribIqama,
          ishaIqama: form.ishaIqama,
        });
        toast.success("Daily prayer times saved");
      }

      if (section === "jumuah") {
        await postOverride({
          section: "jumuah",
          date: todayDateKey(),
          jumuahDate,
          jumuah: jumuahSlots,
        });
        toast.success("Jumu'ah prayer times saved");
      }

      if (section === "eid") {
        await postOverride({
          section: "eid",
          date: eidDate,
          eidDate,
          eidType,
          eidPrayers,
        });
        toast.success("Eid prayer times saved");
      }

      setReloadKey((key) => key + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSavingSection(null);
    }
  }

  async function resetSection(section: OverrideSection) {
    const labels: Record<OverrideSection, string> = {
      daily: "daily prayer overrides",
      jumuah: "Jumu'ah overrides",
      eid: "Eid overrides",
    };

    if (section === "daily" && !selectedDate) return;
    if (section === "eid" && !eidDate) return;

    if (!confirm(`Reset ${labels[section]} to defaults?`)) return;

    const payload: Record<string, unknown> = {
      action: "reset",
      section,
    };

    if (section === "daily") payload.date = selectedDate;
    if (section === "jumuah") payload.jumuahDate = jumuahDate;
    if (section === "eid") {
      payload.date = eidDate;
      payload.eidDate = eidDate;
    }

    const response = await fetch("/api/admin/prayer-times", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      toast.success("Override reset to defaults");
      setReloadKey((key) => key + 1);
    } else {
      toast.error("Failed to reset override");
    }
  }

  return (
    <Tabs defaultValue="daily" className="admin-prayer-times-tabs">
      <TabsList variant="line" className="admin-prayer-times-tabs-list">
        <TabsTrigger value="daily">Daily Prayer Times</TabsTrigger>
        <TabsTrigger value="jumuah">Jumu&apos;ah Prayer</TabsTrigger>
        <TabsTrigger value="eid">Eid Prayer</TabsTrigger>
        <TabsTrigger value="ramadan">Ramadan Timetable</TabsTrigger>
        <TabsTrigger value="monthly">Monthly Timetable</TabsTrigger>
      </TabsList>

      <TabsContent value="daily" className="admin-prayer-times-tab-content">
        <div className="admin-prayer-times-tab-section">
          <div className="admin-prayer-times-tab-header admin-prayer-times-tab-header-daily">
            <div>
              <h2 className="admin-prayer-times-tab-title">
                Daily Prayer Times
              </h2>
              {formLoading && (
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-gold" />
                  Loading…
                </p>
              )}
            </div>
            <div className="space-y-2 sm:w-56">
              {/* <Label htmlFor="daily-date">Date</Label> */}
              <Input
                id="daily-date"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                required
              />
            </div>
          </div>
          <div className="admin-prayer-times-tab-body">
            <div
              className={cn(
                "admin-prayer-times-table-wrap",
                formLoading && "pointer-events-none opacity-60",
              )}
            >
              <Table className="prayer-times-table admin-prayer-times-table admin-prayer-times-table--daily">
                <colgroup>
                  <col className="admin-prayer-times-col-prayer" />
                  <col className="admin-prayer-times-col-adhan-api" />
                  <col className="admin-prayer-times-col-adhan-adjust" />
                  <col className="admin-prayer-times-col-iqama" />
                </colgroup>
                <TableHeader>
                  <TableRow className="prayer-times-table-head hover:bg-transparent">
                    <TableHead className="prayer-times-table-head-cell">
                      Prayer
                    </TableHead>
                    <TableHead className="prayer-times-table-head-cell">
                      Adhan (API)
                    </TableHead>
                    <TableHead className="prayer-times-table-head-cell">
                      Adhan
                    </TableHead>
                    <TableHead className="prayer-times-table-head-cell">
                      Iqama
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DAILY_PRAYERS.map((prayer) => {
                    const disabled = selectedFriday && prayer.key === "dhuhr";

                    return (
                      <TableRow
                        key={prayer.key}
                        className={cn(
                          "prayer-times-table-row",
                          disabled && "prayer-times-table-row-muted",
                        )}
                      >
                        <TableCell className="prayer-times-table-cell font-medium">
                          {prayer.label}
                          {disabled && (
                            <span className="mt-1 block text-xs text-muted-foreground">
                              Replaced by Jumu&apos;ah on Fridays
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="prayer-times-table-cell admin-prayer-times-adhan-api-cell">
                          <AdminAdhanApiTime
                            apiAdhan={form.apiAdhan[prayer.key]}
                          />
                        </TableCell>
                        <TableCell className="prayer-times-table-cell admin-prayer-times-adhan-adjust-cell">
                          <AdminAdhanField
                            apiAdhan={form.apiAdhan[prayer.key]}
                            disabled={disabled}
                            config={
                              form.adhanConfig[prayer.key] ??
                              defaultAdhanConfigEntry()
                            }
                            onChange={(config) =>
                              updateAdhanConfig(prayer.key, config)
                            }
                          />
                        </TableCell>
                        <TableCell className="prayer-times-table-cell admin-prayer-times-iqama-cell">
                          <AdminIqamaField
                            prayer={prayer.key}
                            disabled={disabled}
                            config={
                              form.iqamaConfig[prayer.key] ??
                              defaultIqamaConfigEntry()
                            }
                            legacyIqama={
                              form[
                                `${prayer.key}Iqama` as keyof AdminFormState
                              ] as string
                            }
                            onChange={(config) =>
                              updateIqamaConfig(prayer.key, config)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <TabActions
          saving={savingSection === "daily"}
          disabled={formLoading}
          onSave={() => saveSection("daily")}
          onReset={() => resetSection("daily")}
        />
      </TabsContent>

      <TabsContent value="jumuah" className="admin-prayer-times-tab-content">
        <div className="admin-prayer-times-tab-section">
          <div className="admin-prayer-times-tab-header">
            <div>
              <h2 className="admin-prayer-times-tab-title">
                Jumu&apos;ah Prayers
              </h2>
            </div>
            <Button type="button" variant="outline" onClick={addJumuah}>
              <Plus className="mr-2 h-4 w-4" />
              Add Jumu&apos;ah Prayer
            </Button>
          </div>
          <div className="admin-prayer-times-tab-body">
            {jumuahSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Default Jumu&apos;ah prayer times load automatically. Add
                entries to override.
              </p>
            ) : (
              <div className="admin-prayer-times-table-wrap">
                <Table className="prayer-times-table admin-prayer-times-table admin-prayer-times-table--slots">
                  <colgroup>
                    <col className="admin-prayer-times-col-label" />
                    <col className="admin-prayer-times-col-value" />
                    <col className="admin-prayer-times-col-actions" />
                  </colgroup>
                  <TableHeader>
                    <TableRow className="prayer-times-table-head hover:bg-transparent">
                      <TableHead className="prayer-times-table-head-cell">
                        Prayer
                      </TableHead>
                      <TableHead className="prayer-times-table-head-cell">
                        Adhan
                      </TableHead>
                      <TableHead
                        className="prayer-times-table-head-cell admin-prayer-times-actions-head"
                        aria-label="Actions"
                      />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jumuahSlots.map((jumuah) => (
                      <TableRow
                        key={jumuah.index}
                        className="prayer-times-table-row"
                      >
                        <TableCell className="prayer-times-table-cell font-medium">
                          {getJumuahPrayerLabel(jumuah.index)}
                        </TableCell>
                        <TableCell className="prayer-times-table-cell admin-prayer-times-value-cell">
                          <Input
                            type="time"
                            value={jumuah.adhan}
                            onChange={(event) =>
                              setJumuahSlots((current) =>
                                current.map((item) =>
                                  item.index === jumuah.index
                                    ? { ...item, adhan: event.target.value }
                                    : item,
                                ),
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="prayer-times-table-cell admin-prayer-times-actions-cell">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeJumuah(jumuah.index)}
                            aria-label={`Delete ${getJumuahPrayerLabel(jumuah.index)}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <TabActions
          saving={savingSection === "jumuah"}
          onSave={() => saveSection("jumuah")}
        />
      </TabsContent>

      <TabsContent value="eid" className="admin-prayer-times-tab-content">
        <div className="admin-prayer-times-tab-section">
          <div className="admin-prayer-times-tab-header">
            <div className="space-y-1">
              <h2 className="admin-prayer-times-tab-title">Eid Prayer Times</h2>
              {formLoading && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-gold" />
                  Loading…
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addEidPrayer}
              disabled={formLoading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Eid Prayer
            </Button>
          </div>
          <div className="admin-prayer-times-tab-body admin-prayer-times-tab-body-eid">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="eid-date">Select EID date</Label>
                <Input
                  id="eid-date"
                  type="date"
                  value={eidDate}
                  onChange={(event) => setEidDate(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Eid celebration</Label>
                <div className="flex flex-wrap gap-4 pt-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="eid-type"
                      checked={eidType === "FITR"}
                      disabled={formLoading}
                      onChange={() => selectEidType("FITR")}
                    />
                    Eid-ul-Fitr
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="eid-type"
                      checked={eidType === "ADHA"}
                      disabled={formLoading}
                      onChange={() => selectEidType("ADHA")}
                    />
                    Eid-ul-Adha
                  </label>
                </div>
              </div>
            </div>

            <div
              className={cn(formLoading && "pointer-events-none opacity-60")}
            >
              {eidPrayers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No Eid prayers yet. Add at least one congregation time.
                </p>
              ) : (
                <div className="admin-prayer-times-table-wrap">
                  <Table className="prayer-times-table admin-prayer-times-table admin-prayer-times-table--slots">
                    <colgroup>
                      <col className="admin-prayer-times-col-label" />
                      <col className="admin-prayer-times-col-value" />
                      <col className="admin-prayer-times-col-actions" />
                    </colgroup>
                    <TableHeader>
                      <TableRow className="prayer-times-table-head hover:bg-transparent">
                        <TableHead className="prayer-times-table-head-cell">
                          Prayer
                        </TableHead>
                        <TableHead className="prayer-times-table-head-cell">
                          Time
                        </TableHead>
                        <TableHead
                          className="prayer-times-table-head-cell admin-prayer-times-actions-head"
                          aria-label="Actions"
                        />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eidPrayers.map((prayer) => (
                        <TableRow
                          key={prayer.index}
                          className="prayer-times-table-row"
                        >
                          <TableCell className="prayer-times-table-cell font-medium">
                            {getEidPrayerLabel(prayer.index)}
                          </TableCell>
                          <TableCell className="prayer-times-table-cell admin-prayer-times-value-cell">
                            <Input
                              id={`eid-time-${prayer.index}`}
                              type="time"
                              value={prayer.time}
                              onChange={(event) =>
                                setEidPrayers((current) =>
                                  current.map((item) =>
                                    item.index === prayer.index
                                      ? { ...item, time: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="prayer-times-table-cell admin-prayer-times-actions-cell">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeEidPrayer(prayer.index)}
                              aria-label={`Delete ${getEidPrayerLabel(prayer.index)}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </div>

        <TabActions
          saving={savingSection === "eid"}
          disabled={formLoading}
          onSave={() => saveSection("eid")}
        />
      </TabsContent>

      <TabsContent value="ramadan" className="admin-prayer-times-tab-content">
        <AdminRamadanTimetableTab />
      </TabsContent>

      <TabsContent value="monthly" className="admin-prayer-times-tab-content">
        <AdminMonthlyTimetableTab />
      </TabsContent>
    </Tabs>
  );
}
