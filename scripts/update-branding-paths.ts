import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.setting.upsert({
    where: { key: "logo_path" },
    update: { value: "/logo/logo.png" },
    create: { key: "logo_path", value: "/logo/logo.png" },
  });

  await prisma.setting.upsert({
    where: { key: "favicon_path" },
    update: { value: "/favicon.png" },
    create: { key: "favicon_path", value: "/favicon.png" },
  });

  console.log("Updated logo_path and favicon_path in database.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
