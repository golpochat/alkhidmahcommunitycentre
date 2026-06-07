/**
 * Seeds DonationCategory rows from DONATION_CATEGORIES constants.
 *
 * Run: npm run db:seed-donation-categories
 */
import { PrismaClient } from "@prisma/client";
import { DONATION_CATEGORIES, SITE_URL } from "../src/lib/constants";
import { SETTING_KEYS } from "../src/lib/settings";

const prisma = new PrismaClient();

function buildDonationUrl(slug: string, siteUrl: string) {
  const base = siteUrl.replace(/\/$/, "");
  return `${base}/donations?category=${encodeURIComponent(slug)}`;
}

async function resolveSiteUrl() {
  const setting = await prisma.setting.findUnique({
    where: { key: SETTING_KEYS.siteUrl },
  });
  const fromSettings = setting?.value?.trim();
  if (fromSettings) {
    return fromSettings.replace(/\/$/, "");
  }
  return (process.env.NEXT_PUBLIC_SITE_URL || SITE_URL).replace(/\/$/, "");
}

async function main() {
  const siteUrl = await resolveSiteUrl();

  for (let index = 0; index < DONATION_CATEGORIES.length; index += 1) {
    const category = DONATION_CATEGORIES[index];
    const donationUrl = buildDonationUrl(category.id, siteUrl);

    await prisma.donationCategory.upsert({
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
        name: category.title,
        description: category.description,
        donationUrl,
        sortOrder: index,
      },
    });
  }

  console.log(`Donation categories seeded (${DONATION_CATEGORIES.length} rows).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
