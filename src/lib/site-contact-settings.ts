import { cache } from "react";
import { CLONDLAKIN_COORDS } from "@/lib/constants";
import { getSettingsMap } from "@/lib/queries";
import { DEFAULT_SETTINGS, SETTING_KEYS } from "@/lib/settings";

export interface SiteContactSettings {
  siteName: string;
  charityNumber: string;
  address: string;
  phone: string;
  email: string;
  whatsapp: string;
  socialFacebook: string;
  socialInstagram: string;
  socialYoutube: string;
}

export type SiteSocialLinkId = "facebook" | "instagram" | "youtube" | "whatsapp";

export interface SiteSocialLink {
  id: SiteSocialLinkId;
  href: string;
  label: string;
}

function settingValue(map: Record<string, string>, key: string): string {
  return (map[key] ?? DEFAULT_SETTINGS[key] ?? "").trim();
}

export const getSiteContactSettings = cache(
  async (): Promise<SiteContactSettings> => {
    const map = await getSettingsMap();

    return {
      siteName: settingValue(map, SETTING_KEYS.siteName),
      charityNumber: settingValue(map, SETTING_KEYS.charityNumber),
      address: settingValue(map, SETTING_KEYS.contactAddress),
      phone: settingValue(map, SETTING_KEYS.contactPhone),
      email: settingValue(map, SETTING_KEYS.contactEmail),
      whatsapp: settingValue(map, SETTING_KEYS.contactWhatsapp),
      socialFacebook: settingValue(map, SETTING_KEYS.socialFacebook),
      socialInstagram: settingValue(map, SETTING_KEYS.socialInstagram),
      socialYoutube: settingValue(map, SETTING_KEYS.socialYoutube),
    };
  }
);

export function buildWhatsAppUrl(
  settings: Pick<SiteContactSettings, "whatsapp" | "siteName">,
  message?: string
) {
  const phone = settings.whatsapp.replace(/\D/g, "");
  if (!phone) {
    return "";
  }

  const text =
    message ??
    `Assalamu alaikum, I would like to enquire about ${settings.siteName}.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function buildSiteSocialLinks(
  settings: SiteContactSettings
): SiteSocialLink[] {
  const links: SiteSocialLink[] = [];

  if (settings.socialFacebook) {
    links.push({
      id: "facebook",
      href: settings.socialFacebook,
      label: "Follow us on Facebook",
    });
  }

  if (settings.socialInstagram) {
    links.push({
      id: "instagram",
      href: settings.socialInstagram,
      label: "Follow us on Instagram",
    });
  }

  if (settings.socialYoutube) {
    links.push({
      id: "youtube",
      href: settings.socialYoutube,
      label: "Subscribe on YouTube",
    });
  }

  const whatsappUrl = buildWhatsAppUrl(settings);
  if (whatsappUrl) {
    links.push({
      id: "whatsapp",
      href: whatsappUrl,
      label: "Contact us on WhatsApp",
    });
  }

  return links;
}

export function buildMapEmbedUrl(address: string) {
  const query = encodeURIComponent(address);
  return `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}

export function buildDirectionsUrl(address: string) {
  if (address.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${CLONDLAKIN_COORDS.latitude},${CLONDLAKIN_COORDS.longitude}`;
}

export function buildTelHref(phone: string) {
  const digits = phone.replace(/\s/g, "");
  return digits ? `tel:${digits}` : undefined;
}

export function buildMailtoHref(email: string) {
  return email ? `mailto:${email}` : undefined;
}
