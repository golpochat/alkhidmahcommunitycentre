import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SAMPLE_TAG = "sample-export-test";

async function main() {
  const result = await prisma.donation.deleteMany({
    where: {
      providerId: { startsWith: SAMPLE_TAG },
    },
  });

  console.log(`Removed ${result.count} sample donations.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
