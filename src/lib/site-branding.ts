import "server-only";

import { cache } from "react";
import {
  getSiteContactSettings,
  type SiteContactSettings,
} from "@/lib/site-contact-settings";
import { getSettingsMap } from "@/lib/queries";
import {
  DEFAULT_SETTINGS,
  SETTING_KEYS,
} from "@/lib/settings";
import { FAVICON_PATH, LOGO_PATH, SITE_URL } from "@/lib/constants";

export interface SiteBranding extends SiteContactSettings {
  siteUrl: string;
  logoPath: string;
  faviconPath: string;
}

function settingValue(map: Record<string, string>, key: string, fallback: string) {
  return (map[key] ?? DEFAULT_SETTINGS[key] ?? fallback).trim();
}

export const getSiteBranding = cache(async (): Promise<SiteBranding> => {
  const [contact, map] = await Promise.all([getSiteContactSettings(), getSettingsMap()]);

  return {
    ...contact,
    siteUrl: settingValue(map, SETTING_KEYS.siteUrl, SITE_URL).replace(/\/$/, ""),
    logoPath: settingValue(map, SETTING_KEYS.logoPath, LOGO_PATH),
    faviconPath: settingValue(map, SETTING_KEYS.faviconPath, FAVICON_PATH),
  };
});

export async function resolveSiteUrl() {
  const branding = await getSiteBranding();
  return branding.siteUrl;
}
