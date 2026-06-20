import "server-only";

import { readFile } from "fs/promises";
import path from "path";
import { getDonationStatementBranding } from "@/lib/donation-statement-branding";
import { LOGO_PATH } from "@/lib/constants";
const FONT_CACHE = new Map<string, ArrayBuffer>();

const LOCAL_FONTS = [
  { cacheKey: "poppins-regular", file: "Poppins-Regular.ttf", name: "Poppins", weight: 400 as const },
  { cacheKey: "poppins-semibold", file: "Poppins-SemiBold.ttf", name: "Poppins", weight: 600 as const },
  { cacheKey: "poppins-bold", file: "Poppins-Bold.ttf", name: "Poppins", weight: 700 as const },
] as const;

const FLYER_LOGO_RENDER_WIDTH = 840;

async function loadLocalFont(cacheKey: string, filename: string) {
  if (FONT_CACHE.has(cacheKey)) {
    return FONT_CACHE.get(cacheKey)!;
  }

  const filePath = path.join(process.cwd(), "public", "fonts", filename);
  const file = await readFile(filePath);
  const buffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
  FONT_CACHE.set(cacheKey, buffer);
  return buffer;
}

export async function loadFlyerFonts() {
  return Promise.all(
    LOCAL_FONTS.map(async (font) => ({
      name: font.name,
      data: await loadLocalFont(font.cacheKey, font.file),
      weight: font.weight,
      style: "normal" as const,
    }))
  );
}

async function rasterLogoToDataUrl(relativePath: string) {
  const sharp = (await import("sharp")).default;
  const absolute = path.join(process.cwd(), "public", relativePath.replace(/^\//, ""));
  const file = await readFile(absolute);
  const ext = path.extname(absolute).toLowerCase();

  if (ext === ".png") {
    const png = await sharp(file)
      .resize({ width: FLYER_LOGO_RENDER_WIDTH, withoutEnlargement: true })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  }

  if (ext === ".svg" || ext === ".jpg" || ext === ".jpeg" || ext === ".webp") {
    const png = await sharp(file)
      .resize({ width: FLYER_LOGO_RENDER_WIDTH })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  }

  return null;
}

/** High-resolution logo for flyer headers (from site settings or public fallback). */
export async function loadFlyerLogoDataUrl() {
  try {
    const branding = await getDonationStatementBranding();
    const fromSettings = await rasterLogoToDataUrl(branding.logoPath);
    if (fromSettings) {
      return fromSettings;
    }
  } catch {
    // fall through
  }

  try {
    return await rasterLogoToDataUrl(LOGO_PATH);
  } catch {
    return null;
  }
}
