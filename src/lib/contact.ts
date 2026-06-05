import { CONTACT, SITE_NAME } from "@/lib/constants";
import type { SiteContactSettings } from "@/lib/site-contact-settings";
import {
  buildDirectionsUrl,
  buildMapEmbedUrl,
  buildWhatsAppUrl,
} from "@/lib/site-contact-settings";

export const OPENING_HOURS = [
  { label: "Monday – Friday", value: "9:00 AM – 9:00 PM" },
  { label: "Saturday – Sunday", value: "9:00 AM – 9:00 PM" },
  { label: "Prayer Times", value: "Open for all daily prayers" },
] as const;

export function getWhatsAppUrlForSettings(
  settings: SiteContactSettings,
  message?: string
) {
  return buildWhatsAppUrl(settings, message);
}

export function getMapEmbedUrlForSettings(settings: SiteContactSettings) {
  return buildMapEmbedUrl(settings.address);
}

export function getDirectionsUrlForSettings(settings: SiteContactSettings) {
  return buildDirectionsUrl(settings.address);
}

/** @deprecated Use getWhatsAppUrlForSettings with getSiteContactSettings */
export function getWhatsAppUrl(
  message = `Assalamu alaikum, I would like to enquire about ${SITE_NAME}.`
) {
  return buildWhatsAppUrl(
    { whatsapp: CONTACT.whatsapp, siteName: SITE_NAME },
    message
  );
}

/** @deprecated Use getMapEmbedUrlForSettings */
export function getMapEmbedUrl() {
  return buildMapEmbedUrl(CONTACT.address);
}

/** @deprecated Use getDirectionsUrlForSettings */
export function getDirectionsUrl() {
  return buildDirectionsUrl(CONTACT.address);
}
