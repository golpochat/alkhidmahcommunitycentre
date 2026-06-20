"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Monitor } from "lucide-react";
import { toast } from "sonner";
import {
  AdminAyatFormModal,
  type AyahFormState,
} from "@/components/admin/display/admin-ayat-form-modal";
import {
  AdminAyatSection,
  emptyAyahForm,
  type AyahItem,
} from "@/components/admin/display/admin-ayat-section";
import {
  AdminDisplaySettingsTab,
  formToSavePayload,
  settingsToForm,
  type DisplaySettingsFormState,
} from "@/components/admin/display/admin-display-settings-tab";
import { AdminMessagesCentre } from "@/components/admin/messages/admin-messages-centre";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SerializedDisplaySettings } from "@/lib/display-settings-types";
import {
  DISPLAY_PANEL_AYAT_HADITH,
  DISPLAY_PANEL_NORMAL_MESSAGES,
  DISPLAY_PANEL_PRIORITY_MESSAGES,
  isAyatHadithEnabled,
  isNormalMessagesEnabled,
  isPriorityMessagesEnabled,
  parseDisplaySectionPanels,
} from "@/lib/display-settings-types";
import { parseJsonResponse } from "@/lib/parse-json-response";

export function AdminDisplayManager() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsForm, setSettingsForm] = useState<DisplaySettingsFormState | null>(
    null,
  );
  const [enabledPanels, setEnabledPanels] = useState<string[]>([]);
  const [savingSection, setSavingSection] = useState(false);
  const [ayat, setAyat] = useState<AyahItem[]>([]);
  const [ayahModalOpen, setAyahModalOpen] = useState(false);
  const [ayahForm, setAyahForm] = useState<AyahFormState>(emptyAyahForm);
  const [editingAyahId, setEditingAyahId] = useState<string | null>(null);

  const refreshSectionState = useCallback(async () => {
    try {
      const [settingsRes, ayatRes] = await Promise.all([
        fetch("/api/admin/display/settings"),
        fetch("/api/admin/display/ayat"),
      ]);

      if (settingsRes.ok) {
        const data = (await settingsRes.json()) as SerializedDisplaySettings;
        setSettingsForm(settingsToForm(data));
        setEnabledPanels(data.enabledPanels);
      }
      if (ayatRes.ok) {
        setAyat((await ayatRes.json()) as AyahItem[]);
      }
    } catch {
      // Keep last good state on transient failures
    }
  }, []);

  const [contentRefreshToken, setContentRefreshToken] = useState(0);
  const bumpContentRefresh = useCallback(() => {
    setContentRefreshToken((current) => current + 1);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, ayatRes] = await Promise.all([
        fetch("/api/admin/display/settings"),
        fetch("/api/admin/display/ayat"),
      ]);

      if (settingsRes.ok) {
        const data = (await settingsRes.json()) as SerializedDisplaySettings;
        setSettingsForm(settingsToForm(data));
        setEnabledPanels(data.enabledPanels);
      }
      if (ayatRes.ok) {
        setAyat((await ayatRes.json()) as AyahItem[]);
      }
    } catch {
      toast.error("Failed to load display settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function resetAyahForm() {
    setAyahForm(emptyAyahForm);
    setEditingAyahId(null);
  }

  function handleAyahModalOpenChange(open: boolean) {
    setAyahModalOpen(open);
    if (!open) resetAyahForm();
  }

  function openCreateAyahModal() {
    resetAyahForm();
    setAyahModalOpen(true);
  }

  function openEditAyahModal(item: AyahItem) {
    setEditingAyahId(item.id);
    setAyahForm({
      arabic: item.arabic,
      english: item.english,
      source: item.source,
    });
    setAyahModalOpen(true);
  }

  async function saveSettings() {
    if (!settingsForm) return;
    setSaving(true);
    try {
      const response = await fetch("/api/admin/display/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToSavePayload(settingsForm)),
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
      setAyahModalOpen(false);
      resetAyahForm();
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

  async function toggleAyahRotation(item: AyahItem, includeInRotation: boolean) {
    setAyat((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, includeInRotation } : entry,
      ),
    );

    try {
      const response = await fetch(`/api/admin/display/ayat/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeInRotation }),
      });
      if (!response.ok) {
        const error = await parseJsonResponse<{ error?: string }>(response);
        throw new Error(error.error ?? "Update failed");
      }
      await refreshSectionState();
    } catch (error) {
      setAyat((current) =>
        current.map((entry) => (entry.id === item.id ? item : entry)),
      );
      toast.error(
        error instanceof Error ? error.message : "Failed to update entry",
      );
    }
  }

  async function toggleDisplayPanel(panel: string, enabled: boolean) {
    if (savingSection) return;

    setSavingSection(true);

    try {
      const response = await fetch("/api/admin/display/settings/panels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ panel, enabled }),
      });

      if (!response.ok) {
        const error = await parseJsonResponse<{ error?: string }>(response);
        throw new Error(error.error ?? "Update failed");
      }

      const data = (await response.json()) as SerializedDisplaySettings & {
        enabledItemCount?: number;
      };
      setEnabledPanels(data.enabledPanels);
      setSettingsForm(settingsToForm(data));
      await refreshSectionState();
      bumpContentRefresh();

      if (enabled) {
        const count = data.enabledItemCount ?? 0;
        if (count === 0) {
          toast.message("No eligible items to turn on in this section");
        } else {
          toast.success(
            `Section enabled — ${count} item${count === 1 ? "" : "s"} on TV`,
          );
        }
      } else {
        toast.success("Section hidden from TV");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update section",
      );
    } finally {
      setSavingSection(false);
    }
  }

  const sectionPanels = parseDisplaySectionPanels(enabledPanels);
  const sectionFlags = {
    priorityMessagesEnabled: sectionPanels.priorityMessages,
    normalMessagesEnabled: sectionPanels.normalMessages,
  };

  const enabledAyat = ayat.filter((item) => item.includeInRotation);

  const ayahModal =
    mounted &&
    createPortal(
      <AdminAyatFormModal
        open={ayahModalOpen}
        form={ayahForm}
        editingId={editingAyahId}
        saving={saving}
        onOpenChange={handleAyahModalOpenChange}
        onChange={setAyahForm}
        onSave={() => void saveAyah()}
      />,
      document.body,
    );

  return (
    <div className="admin-display-manager">
      <Tabs defaultValue="content" className="admin-prayer-times-tabs">
        <div className="admin-display-tab-bar">
          <TabsList variant="line" className="admin-prayer-times-tabs-list">
            <TabsTrigger value="content">Screen content</TabsTrigger>
            <TabsTrigger value="settings">Display settings</TabsTrigger>
          </TabsList>
          <a
            href="/display/prayer"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-display-preview-link"
          >
            <Monitor className="mr-2 h-4 w-4" />
            Preview display
          </a>
        </div>

        <TabsContent value="content" className="admin-display-content-tab">
          <AdminMessagesCentre
            ayat={enabledAyat}
            rotationSpeed={settingsForm?.rotationSpeed ?? 10}
            sectionFlags={sectionFlags}
            prioritySectionEnabled={isPriorityMessagesEnabled(enabledPanels)}
            normalSectionEnabled={isNormalMessagesEnabled(enabledPanels)}
            ayatSectionEnabled={isAyatHadithEnabled(enabledPanels)}
            savingSection={savingSection}
            contentRefreshToken={contentRefreshToken}
            onTogglePrioritySection={(enabled) =>
              void toggleDisplayPanel(DISPLAY_PANEL_PRIORITY_MESSAGES, enabled)
            }
            onToggleNormalSection={(enabled) =>
              void toggleDisplayPanel(DISPLAY_PANEL_NORMAL_MESSAGES, enabled)
            }
            onSectionStateChange={() => void refreshSectionState()}
            onEnabledPanelsChange={setEnabledPanels}
          />

          <AdminAyatSection
            ayat={ayat}
            sectionEnabled={isAyatHadithEnabled(enabledPanels)}
            savingSection={savingSection}
            onToggleSection={(enabled) =>
              void toggleDisplayPanel(DISPLAY_PANEL_AYAT_HADITH, enabled)
            }
            onCreate={openCreateAyahModal}
            onEdit={openEditAyahModal}
            onDelete={(id) => void deleteAyah(id)}
            onToggleRotation={(item, includeInRotation) =>
              void toggleAyahRotation(item, includeInRotation)
            }
          />
        </TabsContent>

        <TabsContent value="settings" className="admin-prayer-times-tab-content">
          {settingsForm ? (
            <AdminDisplaySettingsTab
              form={settingsForm}
              saving={saving}
              loading={loading}
              onChange={setSettingsForm}
              onSave={() => void saveSettings()}
            />
          ) : loading ? (
            <div className="admin-display-loading">
              <Loader2 className="h-6 w-6 animate-spin text-gold" />
            </div>
          ) : null}
        </TabsContent>
      </Tabs>

      {ayahModal}
    </div>
  );
}
