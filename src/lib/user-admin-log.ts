import type { UserAdminAction } from "@prisma/client";
import { db } from "@/lib/db";

interface LogUserAdminActionInput {
  userId: string;
  actorEmail?: string | null;
  action: UserAdminAction;
  reason: string;
  details?: string | null;
}

export async function logUserAdminAction(input: LogUserAdminActionInput) {
  return db.userAdminLog.create({
    data: {
      userId: input.userId,
      actorEmail: input.actorEmail ?? null,
      action: input.action,
      reason: input.reason,
      details: input.details ?? null,
    },
  });
}
