import "server-only";

import { format } from "date-fns";
import type { ContactMessage } from "@prisma/client";

export type ContactMessageStatus = "pending" | "handled";

export interface SerializedContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  handledAt: string | null;
  createdAt: string;
}

export function serializeContactMessage(
  row: ContactMessage,
): SerializedContactMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    status: row.status === "handled" ? "handled" : "pending",
    handledAt: row.handledAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function contactMessagesToCsv(rows: ContactMessage[]) {
  return [
    "Name,Email,Subject,Status,Received,Handled At,Message",
    ...rows.map((row) => {
      const message = row.message.replace(/"/g, '""').replace(/\r?\n/g, " ");
      return [
        `"${row.name.replace(/"/g, '""')}"`,
        `"${row.email}"`,
        `"${row.subject.replace(/"/g, '""')}"`,
        row.status === "handled" ? "Handled" : "Pending",
        format(row.createdAt, "yyyy-MM-dd HH:mm"),
        row.handledAt ? format(row.handledAt, "yyyy-MM-dd HH:mm") : "",
        `"${message}"`,
      ].join(",");
    }),
  ].join("\n");
}
