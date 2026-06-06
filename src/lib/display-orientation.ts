import type { DisplayOrientation } from "@/hooks/useOrientation";

export type OrientationOverride = "landscape" | "portrait" | null;

export function resolveDisplayOrientation(
  override: OrientationOverride,
  detected: DisplayOrientation
): DisplayOrientation {
  if (override === "landscape" || override === "portrait") {
    return override;
  }
  return detected;
}
