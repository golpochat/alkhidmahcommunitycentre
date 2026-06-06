"use client";

import { useEffect, useState } from "react";

export type DisplayOrientation = "landscape" | "portrait";

function detectOrientation(): DisplayOrientation {
  if (typeof window === "undefined") return "landscape";
  return window.innerWidth > window.innerHeight ? "landscape" : "portrait";
}

export function useOrientation(): DisplayOrientation {
  const [orientation, setOrientation] = useState<DisplayOrientation>("landscape");

  useEffect(() => {
    const update = () => setOrientation(detectOrientation());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return orientation;
}
