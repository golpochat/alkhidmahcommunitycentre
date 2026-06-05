import type { DonationCategoryRecord } from "@/lib/donation-categories";
import type { FlyerCategoryIconItem } from "@/lib/flyers/types";
import {
  ICON_DAWAH,
  ICON_DEVELOPMENT,
  ICON_FITRAH,
  ICON_IFTAR,
  ICON_RAMADAN,
  ICON_SADAQAH,
  ICON_TARAWEEH,
  ICON_ZAKAH,
} from "@/lib/flyers/svg-assets";

const CATEGORY_ICON_MAP: Record<string, string> = {
  zakah: ICON_ZAKAH,
  sadaqah: ICON_SADAQAH,
  fitrah: ICON_FITRAH,
  "mosque-development": ICON_DEVELOPMENT,
  ramadan: ICON_RAMADAN,
  dawah: ICON_DAWAH,
};

/** Ramadan decorative row uses campaign-style labels mapped to the closest category icon. */
const RAMADAN_CAMPAIGN_ICON_MAP: Record<string, string> = {
  "iftar-sponsorship": ICON_IFTAR,
  sadaqah: ICON_SADAQAH,
  "taraweeh-support": ICON_TARAWEEH,
  "fitrah-aid": ICON_FITRAH,
  "mosque-development": ICON_DEVELOPMENT,
};

const RAMADAN_CAMPAIGN_LABELS: Record<string, string> = {
  "iftar-sponsorship": "Iftar Sponsorship",
  sadaqah: "Sadaqah",
  "taraweeh-support": "Taraweeh Support",
  "fitrah-aid": "Fitrah Aid",
  "mosque-development": "Mosque Development",
};

export function getCategoryIconSrc(slug: string) {
  return CATEGORY_ICON_MAP[slug] ?? ICON_SADAQAH;
}

/** Icon row for gold theme — all active categories from the database. */
export function buildGoldIconRow(
  categories: DonationCategoryRecord[]
): FlyerCategoryIconItem[] {
  return categories.map((category) => ({
    slug: category.slug,
    label: category.name,
    src: getCategoryIconSrc(category.slug),
  }));
}

/**
 * Icon row for Ramadan theme — other active categories, excluding the QR target
 * so the selected cause is not duplicated in the footer row.
 */
export function buildRamadanIconRow(
  categories: DonationCategoryRecord[],
  selectedSlug: string
): FlyerCategoryIconItem[] {
  const others = categories.filter((category) => category.slug !== selectedSlug);

  if (others.length > 0) {
    return others.map((category) => ({
      slug: category.slug,
      label: category.name,
      src: getCategoryIconSrc(category.slug),
    }));
  }

  return Object.entries(RAMADAN_CAMPAIGN_LABELS).map(([key, label]) => ({
    slug: key,
    label,
    src: RAMADAN_CAMPAIGN_ICON_MAP[key] ?? ICON_SADAQAH,
  }));
}
