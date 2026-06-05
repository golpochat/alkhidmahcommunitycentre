import { PrismaClient } from "@prisma/client";
import { ALL_DISPLAY_ROTATION } from "../src/lib/display-rotation-content";

const db = new PrismaClient();

async function main() {
  const existing = await db.ayahRotation.findMany({
    select: { source: true, english: true },
  });

  const existingKeys = new Set(
    existing.map((row) => `${row.source}::${row.english}`)
  );

  const toInsert = ALL_DISPLAY_ROTATION.filter(
    (entry) => !existingKeys.has(`${entry.source}::${entry.english}`)
  );

  if (!toInsert.length) {
    console.log("All display rotation entries already exist.");
    return;
  }

  await db.ayahRotation.createMany({
    data: toInsert.map((entry) => ({
      arabic: entry.arabic,
      english: entry.english,
      source: entry.source,
    })),
  });

  console.log(`Added ${toInsert.length} ayat/hadith to the TV rotation list.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
