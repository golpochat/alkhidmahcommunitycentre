"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminMessageEnginePanel } from "@/components/admin/messages/admin-message-engine-panel";
import { AdminMessageFormModal } from "@/components/admin/messages/admin-message-form-modal";
import { AdminMessageListPanel } from "@/components/admin/messages/admin-message-list-panel";
import {
  createEmptyMessageForm,
  formToApiPayload,
  messageToForm,
} from "@/lib/message-client";
import { rotationMessagesKey } from "@/lib/display-bottom-slides";
import type { CachedAyah } from "@/lib/display-cache";
import type { SerializedMessage } from "@/lib/message-types";
import { parseJsonResponse } from "@/lib/parse-json-response";

interface AdminMessagesCentreProps {
  ayat: CachedAyah[];
  ayatEnabled: boolean;
  announcementsEnabled: boolean;
  rotationSpeed: number;
}

export function AdminMessagesCentre({
  ayat,
  ayatEnabled,
  announcementsEnabled,
  rotationSpeed,
}: AdminMessagesCentreProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [messages, setMessages] = useState<SerializedMessage[]>([]);
  const [rotationQueue, setRotationQueue] = useState<SerializedMessage[]>([]);
  const [form, setForm] = useState(createEmptyMessageForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const messagesRes = await fetch("/api/messages", { cache: "no-store" });

      if (messagesRes.ok) {
        setMessages((await messagesRes.json()) as SerializedMessage[]);
      }
    } catch {
      toast.error("Failed to load messages");
    }
  }, []);

  useEffect(() => {
    void loadData().finally(() => setLoading(false));
    const interval = setInterval(() => {
      void loadData();
    }, 30_000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    const fetchRotation = async () => {
      try {
        const response = await fetch("/api/rotation", { cache: "no-store" });
        if (response.ok) {
          const data = (await response.json()) as SerializedMessage[];
          setRotationQueue((current) =>
            rotationMessagesKey(current) === rotationMessagesKey(data)
              ? current
              : data,
          );
        }
      } catch {
        // Keep last good queue on transient failures
      }
    };

    void fetchRotation();
    const interval = setInterval(() => {
      void fetchRotation();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  function resetForm() {
    setForm(createEmptyMessageForm());
    setEditingId(null);
  }

  function handleModalOpenChange(open: boolean) {
    setModalOpen(open);
    if (!open) resetForm();
  }

  function openCreateModal() {
    resetForm();
    setModalOpen(true);
  }

  function openEditModal(message: SerializedMessage) {
    setEditingId(message.id);
    setForm(messageToForm(message));
    setModalOpen(true);
  }

  async function saveMessage() {
    setSaving(true);
    try {
      const payload = formToApiPayload(form, messages, editingId);
      const response = editingId
        ? await fetch(`/api/messages/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!response.ok) {
        const error = await parseJsonResponse<{ error?: string }>(response);
        throw new Error(error.error ?? "Save failed");
      }

      toast.success(editingId ? "Message updated" : "Message created");
      setModalOpen(false);
      resetForm();
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMessage(id: string) {
    try {
      const response = await fetch(`/api/messages/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      if (editingId === id) {
        setModalOpen(false);
        resetForm();
      }
      toast.success("Message deleted");
      await loadData();
    } catch {
      toast.error("Failed to delete message");
    }
  }

  async function duplicateMessage(message: SerializedMessage) {
    setSaving(true);
    try {
      const duplicateForm = messageToForm(message);
      duplicateForm.title = `${message.title} (copy)`;
      const payload = formToApiPayload(duplicateForm, messages);
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await parseJsonResponse<{ error?: string }>(response);
        throw new Error(error.error ?? "Duplicate failed");
      }
      toast.success("Message duplicated");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Duplicate failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleRotation(
    message: SerializedMessage,
    includeInRotation: boolean,
  ) {
    setMessages((current) =>
      current.map((item) =>
        item.id === message.id ? { ...item, includeInRotation } : item,
      ),
    );

    try {
      const response = await fetch(`/api/messages/${message.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeInRotation }),
      });
      if (!response.ok) {
        const error = await parseJsonResponse<{ error?: string }>(response);
        throw new Error(error.error ?? "Update failed");
      }
      await loadData();
    } catch (error) {
      setMessages((current) =>
        current.map((item) =>
          item.id === message.id
            ? { ...item, includeInRotation: message.includeInRotation }
            : item,
        ),
      );
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update rotation setting",
      );
    }
  }

  async function reorderMessages(
    state: "PRIORITY" | "NON_PRIORITY",
    orderedIds: string[],
  ) {
    try {
      const results = await Promise.all(
        orderedIds.map((id, index) =>
          fetch(`/api/messages/${id}/order`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              state === "PRIORITY"
                ? { priorityOrder: index }
                : { normalOrder: index },
            ),
          }),
        ),
      );
      if (results.some((response) => !response.ok)) {
        throw new Error("Order update failed");
      }
      await loadData();
      toast.success("Order updated");
    } catch {
      toast.error("Failed to update order");
    }
  }

  if (loading) {
    return (
      <div className="admin-display-loading">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="admin-messages-centre">
      <AdminMessageListPanel
        messages={messages}
        onCreate={openCreateModal}
        onEdit={openEditModal}
        onDuplicate={(message) => void duplicateMessage(message)}
        onDelete={(id) => void deleteMessage(id)}
        onToggleRotation={(message, includeInRotation) =>
          void toggleRotation(message, includeInRotation)
        }
        onReorder={reorderMessages}
      />
      <AdminMessageEnginePanel
        messages={messages}
        rotationQueue={rotationQueue}
        ayat={ayat}
        ayatEnabled={ayatEnabled}
        announcementsEnabled={announcementsEnabled}
        rotationSpeed={rotationSpeed}
      />
      <AdminMessageFormModal
        open={modalOpen}
        form={form}
        editingId={editingId}
        saving={saving}
        onOpenChange={handleModalOpenChange}
        onChange={setForm}
        onSave={() => void saveMessage()}
      />
    </div>
  );
}
