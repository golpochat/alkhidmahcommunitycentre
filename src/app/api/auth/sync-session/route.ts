import { NextResponse } from "next/server";
import {
  applyRefreshedSession,
  getSession,
} from "@/lib/auth";
import { getSessionUserFromDb } from "@/lib/session-user";
import { sessionAuthorizationChanged } from "@/lib/session-sync";

export async function GET() {
  const cached = await getSession();

  if (!cached) {
    return NextResponse.json({ synced: false }, { status: 401 });
  }

  const fresh = await getSessionUserFromDb(cached);
  if (!fresh) {
    return NextResponse.json({ synced: false }, { status: 401 });
  }

  const shouldSync = sessionAuthorizationChanged(cached, fresh);
  const response = NextResponse.json({ synced: shouldSync });

  if (shouldSync) {
    await applyRefreshedSession(response, fresh);
  }

  return response;
}
