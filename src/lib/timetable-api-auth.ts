import { NextResponse } from "next/server";
import { canManagePrayerTimes, getSession } from "@/lib/auth";

export async function requireTimetableAdmin() {
  const session = await getSession();
  if (!session || !canManagePrayerTimes(session)) {
    return { session: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session, error: null };
}
