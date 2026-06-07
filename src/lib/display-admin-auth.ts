import { canManageDisplay, getSession } from "@/lib/auth";

export async function requireDisplayAdminSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  if (!canManageDisplay(session)) {
    throw new Error("Forbidden");
  }

  return session;
}
