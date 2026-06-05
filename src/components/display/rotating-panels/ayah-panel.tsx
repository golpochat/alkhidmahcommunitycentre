import type { CachedAyah } from "@/lib/display-cache";

interface AyahPanelProps {
  ayat: CachedAyah[];
  index?: number;
}

export function AyahPanel({ ayat, index = 0 }: AyahPanelProps) {
  const ayah = ayat[index % Math.max(ayat.length, 1)];

  if (!ayah) {
    return (
      <div className="display-rotating-panel display-rotating-panel-empty">
        <h3 className="display-rotating-panel-title">Ayat &amp; Hadith</h3>
        <p className="display-rotating-panel-empty-text">No content configured</p>
      </div>
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
