import type { SerializedDisplayNotice } from "@/lib/display-types";

interface ScrollingTickerProps {
  notices: SerializedDisplayNotice[];
}

export function ScrollingTicker({ notices }: ScrollingTickerProps) {
  const highPriority = notices.filter((notice) => notice.priority === "high");

  if (!highPriority.length) return null;

  const items = highPriority.flatMap((notice) => [
    notice.title,
    notice.message,
  ]);

  const tickerText = items.join("  •  ");

  return (
    <footer className="display-scrolling-ticker">
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
