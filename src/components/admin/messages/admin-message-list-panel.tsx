"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminMessageRow } from "@/components/admin/messages/admin-message-row";
import { Button } from "@/components/ui/button";
import { sortMessagesByOrder } from "@/lib/message-client";
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
  onCreate: () => void;
  onEdit: (message: SerializedMessage) => void;
  onDuplicate: (message: SerializedMessage) => void;
  onDelete: (id: string) => void;
  onToggleRotation: (
    message: SerializedMessage,
    includeInRotation: boolean,
  ) => void;
  onReorder: (
    state: "PRIORITY" | "NON_PRIORITY",
    orderedIds: string[],
  ) => Promise<void>;
}

function MessageTableSection({
  title,
  description,
  messages,
  allMessages,
  isPriority,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleRotation,
  onReorder,
}: {
  title: string;
  description: string;
  messages: SerializedMessage[];
  allMessages: SerializedMessage[];
  isPriority: boolean;
  onEdit: (message: SerializedMessage) => void;
  onDuplicate: (message: SerializedMessage) => void;
  onDelete: (id: string) => void;
  onToggleRotation: (
    message: SerializedMessage,
    includeInRotation: boolean,
  ) => void;
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
      <header className="admin-messages-list-section-header">
        <h3 className="admin-messages-list-section-title">{title}</h3>
        <p className="admin-messages-list-section-description">{description}</p>
      </header>

      <div className="admin-messages-table-wrap">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="admin-table-col-drag"
                aria-label="Reorder"
              />
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="admin-table-col-hide-md">Queue</TableHead>
              <TableHead className="admin-table-col-hide-lg">
                Validity
              </TableHead>
              <TableHead className="admin-table-col-hide-xl">
                Schedule
              </TableHead>
              <TableHead>Rotation</TableHead>
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
                  onToggleRotation={(includeInRotation) =>
                    onToggleRotation(message, includeInRotation)
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
  onCreate,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleRotation,
  onReorder,
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
          <h2 className="admin-messages-panel-title">Message lists</h2>
          <p className="admin-messages-panel-description">
            Drag rows to reorder. The TV queue is built automatically from
            eligible messages: rotation on, status active, and within schedule.
            Priority messages replace non-priority rotation while any priority
            message is valid.
          </p>
        </div>
        <Button className="btn-gold" onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New message
        </Button>
      </header>

      <MessageTableSection
        title="Priority messages"
        description="Shown on TV while valid. Replaces non-priority rotation."
        messages={priorityMessages}
        allMessages={messages}
        isPriority
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onToggleRotation={onToggleRotation}
        onReorder={onReorder}
      />

      <MessageTableSection
        title="Non-priority messages"
        description="Rotate when no valid priority messages exist."
        messages={nonPriorityMessages}
        allMessages={messages}
        isPriority={false}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onToggleRotation={onToggleRotation}
        onReorder={onReorder}
      />
    </section>
  );
}
