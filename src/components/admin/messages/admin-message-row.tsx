"use client";

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
  getMessageShowsLabel,
} from "@/lib/message-client";
import type { SerializedMessage } from "@/lib/message-types";
import type { DragEvent, MouseEvent, PointerEvent } from "react";

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
  onTogglePublished: (published: boolean) => void;
}

function stopRowDrag(event: DragEvent<HTMLElement>) {
  event.stopPropagation();
}

function stopRowInteraction(event: MouseEvent | PointerEvent) {
  event.stopPropagation();
}

function showsBadge(label: string) {
  switch (label) {
    case "Live now":
      return <Badge>Live now</Badge>;
    case "Scheduled":
      return <Badge variant="secondary">Scheduled</Badge>;
    case "Waiting":
      return <Badge variant="outline">Waiting</Badge>;
    case "Expired":
      return <Badge variant="outline">Expired</Badge>;
    default:
      return <Badge variant="outline">Off</Badge>;
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
  onTogglePublished,
}: AdminMessageRowProps) {
  const showsLabel = getMessageShowsLabel(message, allMessages);
  const published =
    message.status === "ACTIVE" && message.includeInRotation;

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
        <Badge variant={message.state === "PRIORITY" ? "default" : "outline"}>
          {message.state === "PRIORITY" ? "Priority" : "Normal"}
        </Badge>
      </TableCell>

      <TableCell>{showsBadge(showsLabel)}</TableCell>

      <TableCell className="admin-table-col-hide-md">
        {message.durationSeconds}s
      </TableCell>

      <TableCell className="admin-messages-table-schedule admin-table-col-hide-lg">
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
            checked={published}
            onCheckedChange={(checked) => onTogglePublished(Boolean(checked))}
            aria-label={`Show ${message.title} on TV`}
          />
          <span
            className={
              published
                ? "admin-messages-rotation-label admin-messages-rotation-label-on"
                : "admin-messages-rotation-label"
            }
          >
            {published ? "On" : "Off"}
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
