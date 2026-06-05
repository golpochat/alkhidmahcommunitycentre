import "server-only";

import { getDonationStatementBranding } from "@/lib/donation-statement-branding";
import { MOSQUE_INFO, type MosqueInfo } from "@/lib/mosqueConfig";

/** Mosque contact + tagline for flyers, resolved from site settings with static fallback. */
export async function getFlyerMosqueInfo(): Promise<MosqueInfo> {
  try {
    const branding = await getDonationStatementBranding();
    const website = branding.website.startsWith("http")
      ? branding.website
      : `https://${branding.website}`;

    return {
      name: branding.siteName,
      address: branding.address,
      phone: branding.phone,
      email: branding.email,
      website,
      tagline: MOSQUE_INFO.tagline,
    };
  } catch {
    return MOSQUE_INFO;
  }
}
