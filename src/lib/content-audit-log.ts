import "server-only";

import type { ContentAuditAction } from "@prisma/client";
import { db } from "@/lib/db";

export type ContentAuditEntityType =
  | "event"
  | "class"
  | "gallery_album"
  | "gallery_item"
  | "donation_category"
  | "legal_policy";

export async function logContentPublishAction(input: {
  entityType: ContentAuditEntityType;
  entityId: string;
  entityTitle: string;
  published: boolean;
  actorEmail?: string | null;
}) {
  const action: ContentAuditAction = input.published ? "PUBLISH" : "UNPUBLISH";

  await db.contentAuditLog.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      entityTitle: input.entityTitle,
      action,
      actorEmail: input.actorEmail?.trim() || null,
    },
  });
}

export interface SerializedContentAuditLog {
  id: string;
  entityType: string;
  entityId: string;
  entityTitle: string;
  action: ContentAuditAction;
  actorEmail: string | null;
  createdAt: string;
}

export function serializeContentAuditLog(
  row: Awaited<ReturnType<typeof listContentAuditLogs>>[number],
): SerializedContentAuditLog {
  return {
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    entityTitle: row.entityTitle,
    action: row.action,
    actorEmail: row.actorEmail,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listContentAuditLogs(limit = 100) {
  return db.contentAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
