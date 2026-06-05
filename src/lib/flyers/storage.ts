import "server-only";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { FlyerTheme } from "@/lib/flyers/constants";

export interface SavedFlyerFile {
  filename: string;
  url: string;
  width: number;
  height: number;
}

function buildFilename(theme: FlyerTheme, categorySlug: string) {
  if (theme === "multi-category") {
    return `flyer-multi-category-all-${Date.now()}.png`;
  }
  return `flyer-${theme}-${categorySlug}-${Date.now()}.png`;
}

/** Persists a PNG buffer under public/flyers/ and returns the public URL. */
export async function saveFlyerPng(
  buffer: Buffer,
  options: {
    theme: FlyerTheme;
    categorySlug: string;
    width: number;
    height: number;
  }
): Promise<SavedFlyerFile> {
  const flyersDir = path.join(process.cwd(), "public", "flyers");
  await mkdir(flyersDir, { recursive: true });

  const filename = buildFilename(options.theme, options.categorySlug);
  await writeFile(path.join(flyersDir, filename), buffer);

  return {
    filename,
    url: `/flyers/${filename}`,
    width: options.width,
    height: options.height,
  };
}
