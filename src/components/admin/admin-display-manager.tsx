"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Loader2, Monitor, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { SerializedDisplayNotice } from "@/lib/display-types";
import type { SerializedDisplaySettings } from "@/lib/display-settings";
import { nowIso, toDatetimeLocalValue } from "@/lib/events";
import { parseJsonResponse } from "@/lib/parse-json-response";

interface AyahItem {
  id: string;
  arabic: string;
  english: string;
  source: string;
  createdAt: string;
}

const PANEL_OPTIONS = [
  { value: "announcements", label: "Announcements" },
  { value: "events", label: "Events" },
  { value: "ayat", label: "Ayat / Hadith" },
  { value: "weather", label: "Weather" },
] as const;

function createEmptyNoticeForm() {
  const now = toDatetimeLocalValue(nowIso());
  return {
    title: "",
    message: "",
    priority: "medium" as "high" | "medium" | "low",
    startDate: now,
    endDate: now,
  };
}

const emptyAyahForm = {
  arabic: "",
  english: "",
  source: "",
};

export function AdminDisplayManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notices, setNotices] = useState<SerializedDisplayNotice[]>([]);
  const [settings, setSettings] = useState<SerializedDisplaySettings | null>(null);
  const [ayat, setAyat] = useState<AyahItem[]>([]);
  const [noticeForm, setNoticeForm] = useState(createEmptyNoticeForm);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [ayahForm, setAyahForm] = useState(emptyAyahForm);
  const [editingAyahId, setEditingAyahId] = useState<string | null>(null);
  const [brightnessJson, setBrightnessJson] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [noticesRes, settingsRes, ayatRes] = await Promise.all([
        fetch("/api/admin/display/notices"),
        fetch("/api/admin/display/settings"),
        fetch("/api/admin/display/ayat"),
      ]);

      if (noticesRes.ok) {
        const data = (await noticesRes.json()) as { all: SerializedDisplayNotice[] };
        setNotices(data.all);
      }
      if (settingsRes.ok) {
        const data = (await settingsRes.json()) as SerializedDisplaySettings;
        setSettings(data);
        setBrightnessJson(
          data.brightnessSchedule
            ? JSON.stringify(data.brightnessSchedule, null, 2)
            : ""
        );
      }
      if (ayatRes.ok) {
        const data = (await ayatRes.json()) as AyahItem[];
        setAyat(data);
      }
    } catch {
      toast.error("Failed to load display settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function saveNotice() {
    setSaving(true);
    try {
      const payload = {
        title: noticeForm.title,
        message: noticeForm.message,
        priority: noticeForm.priority,
        startDate: noticeForm.startDate
          ? new Date(noticeForm.startDate).toISOString()
          : null,
        endDate: noticeForm.endDate
          ? new Date(noticeForm.endDate).toISOString()
          : null,
      };

      const response = editingNoticeId
        ? await fetch(`/api/admin/display/notices/${editingNoticeId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/display/notices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!response.ok) {
        const error = await parseJsonResponse<{ error?: string }>(response);
        throw new Error(error.error ?? "Save failed");
      }

      toast.success(editingNoticeId ? "Notice updated" : "Notice created");
      setNoticeForm(createEmptyNoticeForm());
      setEditingNoticeId(null);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteNotice(id: string) {
    try {
      const response = await fetch(`/api/admin/display/notices/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Delete failed");
      toast.success("Notice deleted");
      await loadData();
    } catch {
      toast.error("Failed to delete notice");
    }
  }

  async function saveSettings() {
    if (!settings) return;
    setSaving(true);
    try {
      let brightnessSchedule: unknown = null;
      if (brightnessJson.trim()) {
        brightnessSchedule = JSON.parse(brightnessJson);
      }

      const response = await fetch("/api/admin/display/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rotationSpeed: settings.rotationSpeed,
          enabledPanels: settings.enabledPanels,
          theme: settings.theme,
          pinCode: settings.pinCode,
          brightnessSchedule,
          orientationOverride: settings.orientationOverride,
          autoFullscreen: settings.autoFullscreen,
        }),
      });

      if (!response.ok) {
        const error = await parseJsonResponse<{ error?: string }>(response);
        throw new Error(error.error ?? "Save failed");
      }

      toast.success("Display settings saved");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveAyah() {
    setSaving(true);
    try {
      const response = editingAyahId
        ? await fetch(`/api/admin/display/ayat/${editingAyahId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ayahForm),
          })
        : await fetch("/api/admin/display/ayat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ayahForm),
          });

      if (!response.ok) {
        const error = await parseJsonResponse<{ error?: string }>(response);
        throw new Error(error.error ?? "Save failed");
      }

      toast.success(editingAyahId ? "Entry updated" : "Entry created");
      setAyahForm(emptyAyahForm);
      setEditingAyahId(null);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAyah(id: string) {
    try {
      const response = await fetch(`/api/admin/display/ayat/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Delete failed");
      toast.success("Entry deleted");
      await loadData();
    } catch {
      toast.error("Failed to delete entry");
    }
  }

  function togglePanel(panel: string) {
    if (!settings) return;
    const enabled = settings.enabledPanels.includes(panel);
    setSettings({
      ...settings,
      enabledPanels: enabled
        ? settings.enabledPanels.filter((item) => item !== panel)
        : [...settings.enabledPanels, panel],
    });
  }

  if (loading) {
    return (
      <div className="admin-display-loading">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="admin-display-manager">
      <div className="admin-display-header">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-gold">
            TV Display Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage prayer time display screens and rotating content
          </p>
        </div>
        <a
          href="/display/prayer"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-gold/40 hover:text-gold"
        >
          <Monitor className="mr-2 h-4 w-4" />
          Preview Display
        </a>
      </div>

      <Tabs defaultValue="notices" className="admin-display-tabs">
        <TabsList variant="line" className="admin-display-tabs-list">
          <TabsTrigger value="notices">Notices</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="ayat">Ayat / Hadith</TabsTrigger>
        </TabsList>

        <TabsContent value="notices" className="admin-display-tab-content">
          <div className="admin-display-grid">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingNoticeId ? "Edit Notice" : "Create Notice"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notice-title">Title</Label>
                  <Input
                    id="notice-title"
                    value={noticeForm.title}
                    onChange={(event) =>
                      setNoticeForm({ ...noticeForm, title: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notice-message">Message</Label>
                  <Textarea
                    id="notice-message"
                    value={noticeForm.message}
                    onChange={(event) =>
                      setNoticeForm({ ...noticeForm, message: event.target.value })
                    }
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={noticeForm.priority}
                    onValueChange={(value) => {
                      if (value) {
                        setNoticeForm({
                          ...noticeForm,
                          priority: value as "high" | "medium" | "low",
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High (ticker)</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="admin-display-date-grid">
                  <div className="space-y-2">
                    <Label htmlFor="notice-start">Start date</Label>
                    <Input
                      id="notice-start"
                      type="datetime-local"
                      value={noticeForm.startDate}
                      onChange={(event) =>
                        setNoticeForm({ ...noticeForm, startDate: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notice-end">End date</Label>
                    <Input
                      id="notice-end"
                      type="datetime-local"
                      value={noticeForm.endDate}
                      onChange={(event) =>
                        setNoticeForm({ ...noticeForm, endDate: event.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveNotice} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingNoticeId ? "Update" : "Create"}
                  </Button>
                  {editingNoticeId && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingNoticeId(null);
                        setNoticeForm(createEmptyNoticeForm());
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Notices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {notices.length === 0 && (
                  <p className="text-sm text-muted-foreground">No notices yet</p>
                )}
                {notices.map((notice) => (
                  <div key={notice.id} className="admin-display-list-item">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{notice.title}</p>
                        <Badge variant="outline">{notice.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{notice.message}</p>
                      {(notice.startDate || notice.endDate) && (
                        <p className="text-xs text-muted-foreground">
                          {notice.startDate
                            ? format(parseISO(notice.startDate), "d MMM yyyy HH:mm")
                            : "—"}
                          {" → "}
                          {notice.endDate
                            ? format(parseISO(notice.endDate), "d MMM yyyy HH:mm")
                            : "—"}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingNoticeId(notice.id);
                          setNoticeForm({
                            title: notice.title,
                            message: notice.message,
                            priority: notice.priority as "high" | "medium" | "low",
                            startDate: notice.startDate
                              ? format(parseISO(notice.startDate), "yyyy-MM-dd'T'HH:mm")
                              : "",
                            endDate: notice.endDate
                              ? format(parseISO(notice.endDate), "yyyy-MM-dd'T'HH:mm")
                              : "",
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteNotice(notice.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="admin-display-tab-content">
          {settings && (
            <Card>
              <CardHeader>
                <CardTitle>Display Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="rotation-speed">
                    Panel rotation speed (seconds)
                  </Label>
                  <Input
                    id="rotation-speed"
                    type="number"
                    min={5}
                    max={120}
                    value={settings.rotationSpeed}
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        rotationSpeed: Number(event.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-3">
                  <Label>Enabled panels</Label>
                  {PANEL_OPTIONS.map((panel) => (
                    <label
                      key={panel.value}
                      className="admin-display-checkbox-row"
                    >
                      <Checkbox
                        checked={settings.enabledPanels.includes(panel.value)}
                        onCheckedChange={() => togglePanel(panel.value)}
                      />
                      <span>{panel.label}</span>
                    </label>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Orientation</Label>
                  <Select
                    value={settings.orientationOverride ?? "auto"}
                    onValueChange={(value) => {
                      if (!value) return;
                      setSettings({
                        ...settings,
                        orientationOverride:
                          value === "auto"
                            ? null
                            : (value as "landscape" | "portrait"),
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (detect from screen)</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                      <SelectItem value="portrait">Portrait</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <label className="admin-display-checkbox-row">
                  <Checkbox
                    checked={settings.autoFullscreen}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        autoFullscreen: checked === true,
                      })
                    }
                  />
                  <span>Auto full screen on load</span>
                </label>

                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={settings.theme}
                    onValueChange={(value) => {
                      if (value) {
                        setSettings({
                          ...settings,
                          theme: value as "hybrid" | "dark" | "light",
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hybrid">Hybrid (green + gold)</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pin-code">PIN code (optional)</Label>
                  <Input
                    id="pin-code"
                    value={settings.pinCode ?? ""}
                    onChange={(event) =>
                      setSettings({ ...settings, pinCode: event.target.value || null })
                    }
                    maxLength={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brightness-schedule">
                    Brightness schedule (JSON)
                  </Label>
                  <Textarea
                    id="brightness-schedule"
                    value={brightnessJson}
                    onChange={(event) => setBrightnessJson(event.target.value)}
                    rows={6}
                    placeholder='{"22:00": 40, "06:00": 100}'
                  />
                </div>

                <Button onClick={saveSettings} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ayat" className="admin-display-tab-content">
          <div className="admin-display-grid">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingAyahId ? "Edit Entry" : "Add Ayat / Hadith"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ayah-arabic">Arabic</Label>
                  <Textarea
                    id="ayah-arabic"
                    value={ayahForm.arabic}
                    onChange={(event) =>
                      setAyahForm({ ...ayahForm, arabic: event.target.value })
                    }
                    rows={3}
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ayah-english">English</Label>
                  <Textarea
                    id="ayah-english"
                    value={ayahForm.english}
                    onChange={(event) =>
                      setAyahForm({ ...ayahForm, english: event.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ayah-source">Source</Label>
                  <Input
                    id="ayah-source"
                    value={ayahForm.source}
                    onChange={(event) =>
                      setAyahForm({ ...ayahForm, source: event.target.value })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveAyah} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingAyahId ? "Update" : "Add"}
                  </Button>
                  {editingAyahId && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingAyahId(null);
                        setAyahForm(emptyAyahForm);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rotation List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="admin-display-rotation-list">
                  {ayat.length === 0 && (
                    <p className="text-sm text-muted-foreground">No entries yet</p>
                  )}
                  {ayat.map((item) => (
                    <div key={item.id} className="admin-display-list-item">
                      <div>
                        <p className="font-medium" dir="rtl">
                          {item.arabic}
                        </p>
                        <p className="text-sm">{item.english}</p>
                        <p className="text-xs text-muted-foreground">{item.source}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingAyahId(item.id);
                            setAyahForm({
                              arabic: item.arabic,
                              english: item.english,
                              source: item.source,
                            });
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteAyah(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
