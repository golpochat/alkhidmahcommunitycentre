import type { DonationCategoryRecord } from "@/lib/donation-categories";
import type { FlyerContent } from "@/lib/flyers/types";
import type { FlyerTheme } from "@/lib/flyers/constants";

const GOLD_SUBTEXT =
  "Your generosity sustains prayer, education, and community services.";
const RAMADAN_SUBTEXT =
  "Your generosity brings light to our community during this blessed month.";
const MULTI_SUBTEXT = "Choose a cause below to make a charitable donation.";
const DEFAULT_SUPPORT_LINE =
  "Every contribution brings barakah and supports ongoing mosque services.";

export function buildSingleCategoryContent(
  category: DonationCategoryRecord,
  theme: Exclude<FlyerTheme, "multi-category">
): FlyerContent {
  const categoryBanner =
    theme === "ramadan" && category.slug === "ramadan"
      ? "RAMADAN CAMPAIGN"
      : category.name;

  const subtext = theme === "ramadan" ? RAMADAN_SUBTEXT : GOLD_SUBTEXT;

  return {
    headline: "SUPPORT YOUR MOSQUE",
    subtext,
    categoryBanner,
    supportLine: category.description?.trim() || DEFAULT_SUPPORT_LINE,
    scanLabel: "SCAN TO DONATE TO",
  };
}

export function buildMultiCategoryContent(): FlyerContent {
  return {
    headline: "SUPPORT YOUR MOSQUE",
    subtext: MULTI_SUBTEXT,
    categoryBanner: "",
    supportLine: "",
    scanLabel: "",
  };
}
