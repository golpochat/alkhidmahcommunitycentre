import { LOGO_PATH, SITE_NAME, SITE_URL } from "@/lib/constants";

/** Al Khidmah email palette — mirrors `globals.css` tokens. */
export const EMAIL_BRAND = {
  gold: "#d4af37",
  goldLight: "#e5c76b",
  emerald: "#0f6b4a",
  black: "#0a0a0a",
  white: "#ffffff",
  pageBg: "#f5f5f5",
  cardBg: "#ffffff",
  border: "#e5e5e5",
  text: "#0a0a0a",
  textMuted: "#737373",
  textOnDark: "#a3a3a3",
  textOnDarkBright: "#f5f5f5",
} as const;

export function getEmailLogoUrl(website?: string, logoPath?: string) {
  const base = (website || SITE_URL).replace(/\/$/, "");
  const path = logoPath || LOGO_PATH;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getDefaultEmailBranding() {
  return {
    siteName: SITE_NAME,
    website: SITE_URL.replace(/\/$/, ""),
    logoUrl: getEmailLogoUrl(),
  };
}
