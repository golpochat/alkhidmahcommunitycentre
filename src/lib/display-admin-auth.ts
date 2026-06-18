import { canManageDisplay, getFreshSession } from "@/lib/auth";

export async function requireDisplayAdminSession() {
  const session = await getFreshSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  if (!canManageDisplay(session)) {
    throw new Error("Forbidden");
  }

  return session;
}
