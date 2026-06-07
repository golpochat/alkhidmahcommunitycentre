import "server-only";

import { DONATION_CATEGORIES, DONATION_CATEGORY_ORDER, SITE_URL } from "@/lib/constants";
import { slugify } from "@/lib/classes";
import { db } from "@/lib/db";
import type { PublicDonationCategory } from "@/lib/donations";
import { getSettingsMap } from "@/lib/queries";
import { DEFAULT_SETTINGS, SETTING_KEYS } from "@/lib/settings";

export interface DonationCategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  donationUrl: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

function buildDonationUrl(slug: string, siteUrl: string) {
  const base = siteUrl.replace(/\/$/, "");
  return `${base}/donations?category=${encodeURIComponent(slug)}`;
}

export async function resolveSiteUrlForDonations() {
  try {
    const settings = await getSettingsMap();
    const fromSettings = settings[SETTING_KEYS.siteUrl]?.trim();
    if (fromSettings) {
      return fromSettings.replace(/\/$/, "");
    }
  } catch {
    // fall through
  }
  return SITE_URL.replace(/\/$/, "");
}

function serializeDonationCategory(row: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  donationUrl: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): DonationCategoryRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    donationUrl: row.donationUrl,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Seed missing donation categories from site constants without overwriting admin edits. */
export async function ensureDonationCategoriesSeeded() {
  const siteUrl = await resolveSiteUrlForDonations();

  for (let index = 0; index < DONATION_CATEGORIES.length; index += 1) {
    const category = DONATION_CATEGORIES[index];
    const donationUrl = buildDonationUrl(category.id, siteUrl);

    await db.donationCategory.upsert({
      where: { slug: category.id },
      create: {
        name: category.title,
        slug: category.id,
        description: category.description,
        donationUrl,
        isActive: false,
        sortOrder: index,
      },
      update: {
        donationUrl,
        sortOrder: index,
      },
    });
  }
}

function displayOrderForSlug(slug: string) {
  const index = DONATION_CATEGORY_ORDER.indexOf(
    slug as (typeof DONATION_CATEGORY_ORDER)[number]
  );
  return index === -1 ? DONATION_CATEGORY_ORDER.length + slug.charCodeAt(0) : index;
}

function sortDonationCategories(records: DonationCategoryRecord[]) {
  return [...records].sort((a, b) => {
    const orderDiff =
      (a.sortOrder ?? displayOrderForSlug(a.slug)) -
      (b.sortOrder ?? displayOrderForSlug(b.slug));
    if (orderDiff !== 0) {
      return orderDiff;
    }
    return a.name.localeCompare(b.name);
  });
}

export async function listAllDonationCategories(): Promise<DonationCategoryRecord[]> {
  await ensureDonationCategoriesSeeded();

  const rows = await db.donationCategory.findMany();
  return sortDonationCategories(rows.map(serializeDonationCategory));
}

export async function listActiveDonationCategories(): Promise<DonationCategoryRecord[]> {
  const rows = await listAllDonationCategories();
  return rows.filter((row) => row.isActive);
}

export async function listPublicDonationCategories(): Promise<PublicDonationCategory[]> {
  const rows = await listActiveDonationCategories();
  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
  }));
}

export async function getDonationCategoryById(id: string) {
  await ensureDonationCategoriesSeeded();

  const row = await db.donationCategory.findUnique({ where: { id } });
  if (!row || !row.isActive) {
    return null;
  }

  return serializeDonationCategory(row);
}

export async function getActiveDonationCategoryBySlug(slug: string) {
  await ensureDonationCategoriesSeeded();

  const row = await db.donationCategory.findFirst({
    where: { slug, isActive: true },
  });

  if (!row) {
    return null;
  }

  return serializeDonationCategory(row);
}

export async function assertActiveDonationCategory(slug: string) {
  const category = await getActiveDonationCategoryBySlug(slug);
  if (!category) {
    throw new Error("Donation category is not available");
  }
  return category;
}

export function defaultDonationUrlForSlug(slug: string) {
  return buildDonationUrl(slug, DEFAULT_SETTINGS[SETTING_KEYS.siteUrl].replace(/\/$/, ""));
}

export async function refreshDonationCategoryUrls() {
  const siteUrl = await resolveSiteUrlForDonations();
  const rows = await db.donationCategory.findMany();

  await Promise.all(
    rows.map((row) =>
      db.donationCategory.update({
        where: { id: row.id },
        data: { donationUrl: buildDonationUrl(row.slug, siteUrl) },
      })
    )
  );
}

function buildUniqueCategorySlug(name: string, existingSlugs: string[]) {
  let base = slugify(name).slice(0, 48) || "category";
  let slug = base;
  let suffix = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function createDonationCategory(input: {
  name: string;
  description: string;
}) {
  await ensureDonationCategoriesSeeded();

  const siteUrl = await resolveSiteUrlForDonations();
  const existing = await db.donationCategory.findMany({ select: { slug: true, sortOrder: true } });
  const maxSortOrder = existing.reduce((max, row) => Math.max(max, row.sortOrder), -1);
  const slug = buildUniqueCategorySlug(
    input.name,
    existing.map((row) => row.slug),
  );

  const row = await db.donationCategory.create({
    data: {
      name: input.name.trim(),
      slug,
      description: input.description.trim(),
      donationUrl: buildDonationUrl(slug, siteUrl),
      isActive: false,
      sortOrder: maxSortOrder + 1,
    },
  });

  return serializeDonationCategory(row);
}

export async function deleteDonationCategory(id: string) {
  const category = await db.donationCategory.findUnique({ where: { id } });

  if (!category) {
    throw new Error("Category not found");
  }

  const donationCount = await db.donation.count({
    where: { category: category.slug },
  });

  if (donationCount > 0) {
    throw new Error(
      "This category cannot be deleted because it has existing donations. Unpublish it instead.",
    );
  }

  await db.donationCategory.delete({ where: { id } });
}
