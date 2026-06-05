import { readFile } from "fs/promises";
import path from "path";
import { CONTACT, SITE_NAME } from "@/lib/constants";
import { getSettingsMap } from "@/lib/queries";
import { DEFAULT_SETTINGS, SETTING_KEYS } from "@/lib/settings";

export interface DonationStatementBranding {
  siteName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  charityNumber: string;
  logoPath: string;
}

function settingValue(
  settings: Record<string, string>,
  key: string,
  fallback: string
) {
  const value = settings[key]?.trim();
  return value || fallback;
}

export async function getDonationStatementBranding(): Promise<DonationStatementBranding> {
  const settings = await getSettingsMap();

  return {
    siteName: settingValue(
      settings,
      SETTING_KEYS.siteName,
      DEFAULT_SETTINGS[SETTING_KEYS.siteName]
    ),
    address: settingValue(
      settings,
      SETTING_KEYS.contactAddress,
      DEFAULT_SETTINGS[SETTING_KEYS.contactAddress]
    ),
    phone: settingValue(
      settings,
      SETTING_KEYS.contactPhone,
      DEFAULT_SETTINGS[SETTING_KEYS.contactPhone]
    ),
    email: settingValue(
      settings,
      SETTING_KEYS.contactEmail,
      DEFAULT_SETTINGS[SETTING_KEYS.contactEmail]
    ),
    website: settingValue(
      settings,
      SETTING_KEYS.siteUrl,
      DEFAULT_SETTINGS[SETTING_KEYS.siteUrl]
    ).replace(/\/$/, ""),
    charityNumber: settingValue(
      settings,
      SETTING_KEYS.charityNumber,
      DEFAULT_SETTINGS[SETTING_KEYS.charityNumber]
    ),
    logoPath: settingValue(
      settings,
      SETTING_KEYS.logoPath,
      DEFAULT_SETTINGS[SETTING_KEYS.logoPath]
    ),
  };
}

/** Raster logo bytes for PDF embedding (PNG). */
export async function loadStatementLogoPng(
  logoPath: string
): Promise<Uint8Array | null> {
  const relative = logoPath.replace(/^\//, "");
  const absolute = path.join(process.cwd(), "public", relative);

  try {
    const file = await readFile(absolute);
    const ext = path.extname(absolute).toLowerCase();

    if (ext === ".png") {
      return new Uint8Array(file);
    }

    const sharp = (await import("sharp")).default;

    if (ext === ".svg" || ext === ".jpg" || ext === ".jpeg" || ext === ".webp") {
      const png = await sharp(file)
        .resize({ width: 320, withoutEnlargement: true })
        .png()
        .toBuffer();
      return new Uint8Array(png);
    }
  } catch {
    return null;
  }

  return null;
}

export function defaultDonationStatementBranding(): DonationStatementBranding {
  return {
    siteName: SITE_NAME,
    address: CONTACT.address,
    phone: CONTACT.phone,
    email: CONTACT.email,
    website: DEFAULT_SETTINGS[SETTING_KEYS.siteUrl].replace(/\/$/, ""),
    charityNumber: DEFAULT_SETTINGS[SETTING_KEYS.charityNumber],
    logoPath: DEFAULT_SETTINGS[SETTING_KEYS.logoPath],
  };
}
