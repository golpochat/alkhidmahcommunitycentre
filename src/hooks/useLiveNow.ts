"use client";

import { useEffect, useState } from "react";

/** Live clock that avoids SSR/client hydration mismatches. */
export function useLiveNow() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return now;
}
