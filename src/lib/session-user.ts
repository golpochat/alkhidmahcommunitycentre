import { loadSessionUserById } from "@/lib/access-control";
import type { SessionUser } from "@/lib/auth";

export async function getSessionUserFromDb(
  session: SessionUser
): Promise<SessionUser | null> {
  return loadSessionUserById(session.id);
}
