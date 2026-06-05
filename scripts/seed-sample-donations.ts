/**
 * Inserts sample donations for testing PDF page breaks / multi-page statements.
 *
 * Run: npm run db:seed-donations-sample
 * Remove: npm run db:clear-donations-sample
 */
import { PrismaClient } from "@prisma/client";
import { DONATION_CATEGORIES } from "../src/lib/constants";

const prisma = new PrismaClient();

const SAMPLE_TAG = "sample-export-test";

const DONOR_NAMES = [
  "Anonymous",
  "Ahmed Hassan",
  "Fatima O'Connor",
  "Muhammad Abdullah Al-Rashid",
  "Sarah Murphy",
  "Omar Benali",
  "Aisha Khan",
  "Patrick Fitzgerald",
  "Yusuf Ibrahim",
  "Maryam Al-Zahra Community Fund",
  "John Smith",
  "Layla Rahman",
  "Ciaran O'Sullivan",
  "Hassan Mahmoud",
  "Emily Johnson",
];

const STATUSES = ["pending", "succeeded", "failed"] as const;
const PROVIDERS = ["stripe", "paypal"] as const;

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomAmount(index: number) {
  const presets = [5, 10, 20, 25, 50, 75, 100, 150, 200, 500];
  return presets[index % presets.length];
}

async function main() {
  const count = 75;
  const now = new Date();
  const records = [];

  for (let i = 0; i < count; i += 1) {
    const daysAgo = i % 45;
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - daysAgo);
    createdAt.setHours(9 + (i % 10), (i * 7) % 60, 0, 0);

    const category = DONATION_CATEGORIES[i % DONATION_CATEGORIES.length].id;
    const status = STATUSES[i % STATUSES.length];
    const provider = PROVIDERS[i % PROVIDERS.length];

    records.push({
      donorName: i % 4 === 0 ? null : randomItem(DONOR_NAMES),
      donorEmail: i % 5 === 0 ? null : `donor${i + 1}@example.com`,
      amount: randomAmount(i),
      currency: "EUR",
      category,
      provider,
      providerId: `${SAMPLE_TAG}-${String(i + 1).padStart(3, "0")}`,
      status,
      createdAt,
    });
  }

  const result = await prisma.donation.createMany({ data: records });

  const oldest = records[records.length - 1].createdAt;
  const newest = records[0].createdAt;
  const from = oldest.toISOString().slice(0, 10);
  const to = newest.toISOString().slice(0, 10);

  console.log(`Created ${result.count} sample donations (tag: ${SAMPLE_TAG}).`);
  console.log("");
  console.log("Test in admin → Donations:");
  console.log(`  From: ${from}`);
  console.log(`  To:   ${to}`);
  console.log("  Then export PDF — expect 2–3 pages.");
  console.log("");
  console.log("Remove samples: npm run db:clear-donations-sample");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
