"use client";

import { useEffect } from "react";

/** Refresh the auth cookie when DB permissions diverge from the JWT (Route Handler only). */
export function SessionCookieSync() {
  useEffect(() => {
    void fetch("/api/auth/sync-session", { credentials: "same-origin" });
  }, []);

  return null;
}
