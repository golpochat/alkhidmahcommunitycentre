import "server-only";

import { canAccessUserRoutes, requireSession } from "@/lib/auth";

export async function requireMemberPortalSession() {
  const session = await requireSession();

  if (!canAccessUserRoutes(session)) {
    throw new Error("Forbidden");
  }

  return session;
}
