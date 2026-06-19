"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "alkhidmah-cookie-notice-ack";

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const acknowledged = window.localStorage.getItem(STORAGE_KEY) === "true";
    setVisible(!acknowledged);
  }, []);

  if (!visible) {
    return null;
  }

  function acknowledge() {
    window.localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  }

  return (
    <div className="cookie-notice" role="dialog" aria-live="polite" aria-label="Cookie notice">
      <div className="cookie-notice-inner section-container">
        <p className="cookie-notice-text">
          We use strictly necessary cookies for sign-in and site security. See our{" "}
          <Link href="/legal/cookie-policy" className="text-gold underline-offset-4 hover:underline">
            Cookie Policy
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy-policy" className="text-gold underline-offset-4 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <Button type="button" size="sm" className="btn-gold shrink-0" onClick={acknowledge}>
          Accept
        </Button>
      </div>
    </div>
  );
}
