import { PrismaClient } from "@prisma/client";
import { getEventCardImage, getGalleryImageByTitle } from "../src/lib/images";

const prisma = new PrismaClient();

async function main() {
  const galleryItems = await prisma.galleryItem.findMany();
  for (const item of galleryItems) {
    const imageUrl = getGalleryImageByTitle(item.title, item.category);
    await prisma.galleryItem.update({
      where: { id: item.id },
      data: { imageUrl },
    });
  }

  const events = await prisma.event.findMany();
  for (const event of events) {
    await prisma.event.update({
      where: { id: event.id },
      data: {
        imageUrl: getEventCardImage(event.slug, event.category),
      },
    });
  }

  await prisma.setting.upsert({
    where: { key: "logo_path" },
    update: { value: "/logo/logo.png" },
    create: { key: "logo_path", value: "/logo/logo.png" },
  });

  await prisma.setting.upsert({
    where: { key: "favicon_path" },
    update: { value: "/favicon.svg" },
    create: { key: "favicon_path", value: "/favicon.svg" },
  });

  console.log(
    `Updated ${galleryItems.length} gallery items and ${events.length} events.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
