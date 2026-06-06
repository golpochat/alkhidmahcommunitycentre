"use client";

import { useEffect, useState } from "react";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isFullscreen, requestFullscreen } from "@/lib/fullscreen";

export function DisplayFullscreenButton() {
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const sync = () => setFullscreen(isFullscreen());
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  if (fullscreen) return null;

  return (
    <Button
      type="button"
      variant="outline"
      className="display-fullscreen-button"
      onClick={() => {
        requestFullscreen().catch(() => {});
      }}
    >
      <Maximize2 className="mr-2 h-4 w-4" />
      Go Full Screen
    </Button>
  );
}
