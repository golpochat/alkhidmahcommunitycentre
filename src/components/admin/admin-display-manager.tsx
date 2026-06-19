"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Monitor, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminMessagesCentre } from "@/components/admin/messages/admin-messages-centre";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import type { SerializedDisplaySettings } from "@/lib/display-settings";
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

const emptyAyahForm = {
  arabic: "",
  english: "",
  source: "",
};

export function AdminDisplayManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SerializedDisplaySettings | null>(null);
  const [ayat, setAyat] = useState<AyahItem[]>([]);
  const [ayahForm, setAyahForm] = useState(emptyAyahForm);
  const [editingAyahId, setEditingAyahId] = useState<string | null>(null);
  const [brightnessJson, setBrightnessJson] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, ayatRes] = await Promise.all([
        fetch("/api/admin/display/settings"),
        fetch("/api/admin/display/ayat"),
      ]);

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

  return (
    <div className="admin-display-manager">
      <div className="admin-display-toolbar">
        <p className="admin-display-toolbar-summary">
          Control what appears on the mosque TV prayer screens. Adhan and iqamah
          times are managed under{" "}
          <a href="/admin/special-prayers" className="admin-display-inline-link">
            Special Prayers
          </a>
          , not here.
        </p>
        <a
          href="/display/prayer"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-display-preview-link"
        >
          <Monitor className="mr-2 h-4 w-4" />
          Preview Display
        </a>
      </div>

      <Tabs defaultValue="notices" className="admin-prayer-times-tabs">
        <TabsList variant="line" className="admin-prayer-times-tabs-list">
          <TabsTrigger value="notices">Announcements</TabsTrigger>
          <TabsTrigger value="settings">Screen Setup</TabsTrigger>
          <TabsTrigger value="ayat">Ayat &amp; Hadith</TabsTrigger>
        </TabsList>

        <TabsContent value="notices" className="admin-prayer-times-tab-content">
          <div className="admin-prayer-times-tab-section">
            <AdminMessagesCentre
              ayat={ayat}
              ayatEnabled={settings?.enabledPanels.includes("ayat") ?? false}
              announcementsEnabled={
                settings?.enabledPanels.includes("announcements") ?? false
              }
              rotationSpeed={settings?.rotationSpeed ?? 10}
            />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="admin-prayer-times-tab-content">
          <div className="admin-prayer-times-tab-section">
            <div className="admin-prayer-times-tab-header">
              <div>
                <h2 className="admin-prayer-times-tab-title">Screen Setup</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  How the TV behaves: which side panels rotate, orientation,
                  theme, PIN, and brightness. Turn panels on here; edit their
                  content in the other tabs.
                </p>
              </div>
            </div>

          {loading ? (
            <div className="admin-display-loading">
              <Loader2 className="h-6 w-6 animate-spin text-gold" />
            </div>
          ) : settings ? (
            <div className="admin-display-card">
              <div className="admin-display-card-header">
                <h3 className="admin-prayer-times-tab-title">Display options</h3>
              </div>
              <div className="admin-display-card-body">
                <div className="admin-display-settings-grid">
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

                <div className="admin-display-settings-span-full space-y-3">
                  <Label>Rotating side panels</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose which panels cycle on the TV. Announcements use the
                    Announcements tab; Ayat &amp; Hadith use the Ayat &amp;
                    Hadith tab. Events show published upcoming items from Admin
                    → Events (sample events may exist from initial setup).
                    Weather appears beside the countdown when enabled.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
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
                </div>

                <label className="admin-display-checkbox-row admin-display-settings-span-full">
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

                <div className="admin-display-settings-span-full space-y-2">
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
                </div>

                <Button onClick={saveSettings} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </div>
            </div>
          ) : null}
          </div>
        </TabsContent>

        <TabsContent value="ayat" className="admin-prayer-times-tab-content">
          <div className="admin-prayer-times-tab-section">
            <div className="admin-prayer-times-tab-header">
              <div>
                <h2 className="admin-prayer-times-tab-title">Ayat &amp; Hadith</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Arabic text, translation, and source for the rotating quotes
                  panel. Enable &quot;Ayat / Hadith&quot; under Screen Setup for
                  these to appear on the TV.
                </p>
              </div>
            </div>

            <div className="admin-display-grid">
            <div className="admin-display-card">
              <div className="admin-display-card-header">
                <h3 className="admin-prayer-times-tab-title">
                  {editingAyahId ? "Edit entry" : "Add Ayat / Hadith"}
                </h3>
              </div>
              <div className="admin-display-card-body space-y-4">
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
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button className="sm:w-auto" onClick={saveAyah} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingAyahId ? "Update" : "Add"}
                  </Button>
                  {editingAyahId && (
                    <Button
                      variant="outline"
                      className="sm:w-auto"
                      onClick={() => {
                        setEditingAyahId(null);
                        setAyahForm(emptyAyahForm);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="admin-display-card">
              <div className="admin-display-card-header">
                <h3 className="admin-prayer-times-tab-title">Rotation list</h3>
              </div>
              <div className="admin-display-card-body">
                <div className="admin-table-wrap">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Arabic</TableHead>
                        <TableHead className="admin-table-col-hide-md">English</TableHead>
                        <TableHead className="admin-table-col-hide-lg">Source</TableHead>
                        <TableHead className="admin-table-col-actions">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ayat.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="admin-table-empty">
                            No entries yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        ayat.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="admin-table-title-cell" dir="rtl">
                              {item.arabic}
                            </TableCell>
                            <TableCell className="admin-table-col-hide-md">
                              {item.english}
                            </TableCell>
                            <TableCell className="admin-table-col-hide-lg text-muted-foreground">
                              {item.source}
                            </TableCell>
                            <TableCell className="admin-table-col-actions">
                              <div className="admin-table-action-group">
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
                                  size="icon-sm"
                                  variant="outline"
                                  onClick={() => deleteAyah(item.id)}
                                  aria-label="Delete entry"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
