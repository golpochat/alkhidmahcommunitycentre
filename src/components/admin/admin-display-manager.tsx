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
import { parseJsonResponse } from "@/lib/parse-json-response";

export function AdminDisplayManager() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsForm, setSettingsForm] = useState<DisplaySettingsFormState | null>(
    null,
  );
  const [ayat, setAyat] = useState<AyahItem[]>([]);
  const [ayahModalOpen, setAyahModalOpen] = useState(false);
  const [ayahForm, setAyahForm] = useState<AyahFormState>(emptyAyahForm);
  const [editingAyahId, setEditingAyahId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
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
    } catch (error) {
      setAyat((current) =>
        current.map((entry) => (entry.id === item.id ? item : entry)),
      );
      toast.error(
        error instanceof Error ? error.message : "Failed to update entry",
      );
    }
  }

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
          />

          <AdminAyatSection
            ayat={ayat}
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
