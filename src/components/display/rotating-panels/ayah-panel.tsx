import type { CachedAyah } from "@/lib/display-cache";
import { DisplayLandscapePanelShell } from "@/components/display/display-landscape-panel-shell";

interface AyahPanelProps {
  ayat: CachedAyah[];
  index?: number;
  variant?: "default" | "landscape";
}

export function AyahPanel({ ayat, index = 0, variant = "default" }: AyahPanelProps) {
  const ayah = ayat[index % Math.max(ayat.length, 1)];

  if (!ayah) {
    return (
      <div className="display-rotating-panel display-rotating-panel-empty">
        <h3 className="display-rotating-panel-title">Ayat &amp; Hadith</h3>
        <p className="display-rotating-panel-empty-text">No content configured</p>
      </div>
    );
  }

  if (variant === "landscape") {
    return (
      <DisplayLandscapePanelShell kicker="Ayat & Hadith">
        <p className="display-landscape-panel-headline display-landscape-panel-headline-ayah">
          <span className="display-landscape-panel-emphasis display-landscape-panel-emphasis-ayah">
            {ayah.arabic}
          </span>
          <span className="display-landscape-panel-separator"> · </span>
          <span className="display-landscape-panel-detail">{ayah.english}</span>
        </p>
        <p className="display-landscape-panel-source">{ayah.source}</p>
      </DisplayLandscapePanelShell>
    );
  }

  return (
    <div className="display-rotating-panel display-rotating-panel-ayah">
      <h3 className="display-rotating-panel-title">Ayat &amp; Hadith</h3>
      <p className="display-ayah-arabic">{ayah.arabic}</p>
      <p className="display-ayah-english">{ayah.english}</p>
      <p className="display-ayah-source">{ayah.source}</p>
    </div>
  );
}
