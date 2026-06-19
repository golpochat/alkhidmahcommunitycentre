"use client";

import type { RotationMessage } from "@/lib/rotation-client";

interface ScrollingTickerProps {
  messages: RotationMessage[];
}

export function ScrollingTicker({ messages }: ScrollingTickerProps) {
  const priorityMessages = messages.filter(
    (message) => message.state === "PRIORITY",
  );

  if (!priorityMessages.length) return null;

  const tickerText = priorityMessages.map((message) => message.title).join("  •  ");

  return (
    <footer className="display-scrolling-ticker display-scrolling-ticker-priority">
      <div className="display-scrolling-ticker-line" />
      <div className="display-scrolling-ticker-track">
        <p className="display-scrolling-ticker-text">{tickerText}</p>
        <p className="display-scrolling-ticker-text" aria-hidden="true">
          {tickerText}
        </p>
      </div>
    </footer>
  );
}
