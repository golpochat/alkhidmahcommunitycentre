"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminDisplaySectionSwitch } from "@/components/admin/display/admin-display-section-switch";
import { AdminMessageRow } from "@/components/admin/messages/admin-message-row";
import { Button } from "@/components/ui/button";
import { sortMessagesByOrder, type MessageSectionFlags } from "@/lib/message-client";
import type { SerializedMessage } from "@/lib/message-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AdminMessageListPanelProps {
  messages: SerializedMessage[];
  sectionFlags: MessageSectionFlags;
  prioritySectionEnabled: boolean;
  normalSectionEnabled: boolean;
  savingSection?: boolean;
  onTogglePrioritySection: (enabled: boolean) => void;
  onToggleNormalSection: (enabled: boolean) => void;
  onCreate: () => void;
  onEdit: (message: SerializedMessage) => void;
  onDuplicate: (message: SerializedMessage) => void;
  onDelete: (id: string) => void;
  onTogglePublished: (message: SerializedMessage, published: boolean) => void;
  onReorder: (
    state: "PRIORITY" | "NON_PRIORITY",
    orderedIds: string[],
  ) => Promise<void>;
  footer?: React.ReactNode;
}

function MessageTableSection({
  title,
  description,
  sectionLabel,
  sectionEnabled,
  savingSection,
  onToggleSection,
  messages,
  allMessages,
  sectionFlags,
  isPriority,
  onEdit,
  onDuplicate,
  onDelete,
  onTogglePublished,
  onReorder,
}: {
  title: string;
  description: string;
  sectionLabel: string;
  sectionEnabled: boolean;
  savingSection?: boolean;
  onToggleSection: (enabled: boolean) => void;
  messages: SerializedMessage[];
  allMessages: SerializedMessage[];
  sectionFlags: MessageSectionFlags;
  isPriority: boolean;
  onEdit: (message: SerializedMessage) => void;
  onDuplicate: (message: SerializedMessage) => void;
  onDelete: (id: string) => void;
  onTogglePublished: (message: SerializedMessage, published: boolean) => void;
  onReorder: (
    state: "PRIORITY" | "NON_PRIORITY",
    orderedIds: string[],
  ) => Promise<void>;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const ordered = useMemo(() => sortMessagesByOrder(messages), [messages]);

  async function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setDropTargetId(null);
      return;
    }

    const ids = ordered.map((message) => message.id);
    const fromIndex = ids.indexOf(draggingId);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const nextIds = [...ids];
    const [moved] = nextIds.splice(fromIndex, 1);
    nextIds.splice(toIndex, 0, moved);

    setDraggingId(null);
    setDropTargetId(null);
    await onReorder(isPriority ? "PRIORITY" : "NON_PRIORITY", nextIds);
  }

  return (
    <section className="admin-messages-list-section">
      <header className="admin-messages-list-section-header admin-messages-list-section-header-row">
        <div>
          <h3 className="admin-messages-list-section-title">{title}</h3>
          <p className="admin-messages-list-section-description">{description}</p>
        </div>
        <AdminDisplaySectionSwitch
          label={sectionLabel}
          checked={sectionEnabled}
          disabled={savingSection}
          onCheckedChange={onToggleSection}
        />
      </header>

      <div className="admin-messages-table-wrap">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="admin-table-col-drag" aria-label="Reorder" />
              <TableHead>Title</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Shows</TableHead>
              <TableHead className="admin-table-col-hide-md">Duration</TableHead>
              <TableHead className="admin-table-col-hide-lg">Ends</TableHead>
              <TableHead>On TV</TableHead>
              <TableHead className="admin-table-col-actions">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="admin-messages-table-empty">
                  No messages in this section yet.
                </TableCell>
              </TableRow>
            ) : (
              ordered.map((message) => (
                <AdminMessageRow
                  key={message.id}
                  message={message}
                  allMessages={allMessages}
                  sectionFlags={sectionFlags}
                  dragging={draggingId === message.id}
                  dropTarget={dropTargetId === message.id}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", message.id);
                    setDraggingId(message.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDropTargetId(null);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDropTargetId(message.id);
                  }}
                  onDrop={() => void handleDrop(message.id)}
                  onEdit={() => onEdit(message)}
                  onDuplicate={() => onDuplicate(message)}
                  onDelete={() => onDelete(message.id)}
                  onTogglePublished={(published) =>
                    onTogglePublished(message, published)
                  }
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

export function AdminMessageListPanel({
  messages,
  sectionFlags,
  prioritySectionEnabled,
  normalSectionEnabled,
  savingSection,
  onTogglePrioritySection,
  onToggleNormalSection,
  onCreate,
  onEdit,
  onDuplicate,
  onDelete,
  onTogglePublished,
  onReorder,
  footer,
}: AdminMessageListPanelProps) {
  const priorityMessages = messages.filter(
    (message) => message.state === "PRIORITY",
  );
  const nonPriorityMessages = messages.filter(
    (message) => message.state === "NON_PRIORITY",
  );

  return (
    <section className="admin-messages-panel admin-messages-panel-list">
      <header className="admin-messages-panel-header admin-messages-panel-header-row">
        <div>
          <h2 className="admin-messages-panel-title">Announcements</h2>
          <p className="admin-messages-panel-description">
            Drag to reorder within each tier. Priority messages replace general
            rotation while active. Use section switches or per-message On TV to
            control what appears on screen.
          </p>
        </div>
        <Button className="btn-gold" onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New message
        </Button>
      </header>

      <MessageTableSection
        title="Priority messages"
        description="Replace general rotation while active and within schedule."
        sectionLabel="Priority section"
        sectionEnabled={prioritySectionEnabled}
        savingSection={savingSection}
        onToggleSection={onTogglePrioritySection}
        messages={priorityMessages}
        allMessages={messages}
        sectionFlags={sectionFlags}
        isPriority
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onTogglePublished={onTogglePublished}
        onReorder={onReorder}
      />

      <MessageTableSection
        title="General announcements"
        description="Rotate with Ayat & Hadith when no valid priority messages are active."
        sectionLabel="Announcements section"
        sectionEnabled={normalSectionEnabled}
        savingSection={savingSection}
        onToggleSection={onToggleNormalSection}
        messages={nonPriorityMessages}
        allMessages={messages}
        sectionFlags={sectionFlags}
        isPriority={false}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onTogglePublished={onTogglePublished}
        onReorder={onReorder}
      />

      {footer}
    </section>
  );
}
