"use client";

import type { DragEvent, MouseEvent, PointerEvent } from "react";
import { Copy, GripVertical, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  formatMessageSchedule,
  getMessageQueueExclusionReason,
  getMessageValidity,
  isMessageInRotationQueue,
  type MessageValidity,
} from "@/lib/message-client";
import type { SerializedMessage } from "@/lib/message-types";

interface AdminMessageRowProps {
  message: SerializedMessage;
  allMessages: SerializedMessage[];
  dragging: boolean;
  dropTarget: boolean;
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLTableRowElement>) => void;
  onDrop: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleRotation: (includeInRotation: boolean) => void;
}

function stopRowDrag(event: DragEvent<HTMLElement>) {
  event.stopPropagation();
}

function stopRowInteraction(event: MouseEvent | PointerEvent) {
  event.stopPropagation();
}

function queueStatusBadge(
  message: SerializedMessage,
  allMessages: SerializedMessage[],
) {
  if (isMessageInRotationQueue(message, allMessages)) {
    return <Badge>In queue</Badge>;
  }

  const reason = getMessageQueueExclusionReason(message, allMessages);
  return (
    <Badge variant="outline" title={reason ?? undefined}>
      {reason ?? "Excluded"}
    </Badge>
  );
}

function validityBadge(validity: MessageValidity) {
  switch (validity) {
    case "active_now":
      return <Badge>Active now</Badge>;
    case "upcoming":
      return <Badge variant="secondary">Upcoming</Badge>;
    case "expired":
      return <Badge variant="outline">Expired</Badge>;
    case "inactive":
      return <Badge variant="outline">Inactive</Badge>;
    default:
      return <Badge variant="secondary">Out of rotation</Badge>;
  }
}

export function AdminMessageRow({
  message,
  allMessages,
  dragging,
  dropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleRotation,
}: AdminMessageRowProps) {
  const validity = getMessageValidity(message);

  return (
    <TableRow
      className={`admin-messages-table-row${dragging ? " admin-messages-table-row-dragging" : ""}${dropTarget ? " admin-messages-table-row-drop-target" : ""}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <TableCell className="admin-messages-table-drag">
        <button
          type="button"
          className="admin-message-row-handle"
          draggable
          aria-label="Drag to reorder"
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>

      <TableCell className="admin-messages-table-title">{message.title}</TableCell>

      <TableCell>
        <Badge variant="outline">
          {message.status === "ACTIVE" ? "Active" : "Inactive"}
        </Badge>
      </TableCell>

      <TableCell className="admin-table-col-hide-md">
        {queueStatusBadge(message, allMessages)}
      </TableCell>

      <TableCell className="admin-table-col-hide-lg">
        {validityBadge(validity)}
      </TableCell>

      <TableCell className="admin-messages-table-schedule admin-table-col-hide-xl">
        {formatMessageSchedule(message)}
      </TableCell>

      <TableCell
        className="admin-messages-table-rotation"
        onMouseDown={stopRowInteraction}
        onPointerDown={stopRowInteraction}
        onDragStart={stopRowDrag}
      >
        <div className="admin-messages-rotation-control">
          <Switch
            className="admin-messages-rotation-switch"
            checked={message.includeInRotation}
            onCheckedChange={(checked) => onToggleRotation(Boolean(checked))}
            aria-label={`Include ${message.title} in rotation`}
          />
          <span
            className={
              message.includeInRotation
                ? "admin-messages-rotation-label admin-messages-rotation-label-on"
                : "admin-messages-rotation-label"
            }
          >
            {message.includeInRotation ? "On" : "Off"}
          </span>
        </div>
      </TableCell>

      <TableCell
        className="admin-messages-table-actions"
        onMouseDown={stopRowInteraction}
        onPointerDown={stopRowInteraction}
        onDragStart={stopRowDrag}
      >
        <div className="admin-messages-table-action-group">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onEdit}
            aria-label={`Edit ${message.title}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onDuplicate}
            aria-label={`Duplicate ${message.title}`}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onDelete}
            aria-label={`Delete ${message.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
