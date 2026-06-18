import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { GALLERY_SEED_IMAGES, IMAGES } from "../src/lib/images";
import { getRoleIdBySlug, seedRbac } from "../src/lib/seed-rbac";
import { MEMBER_ROLE_SLUG, SUPER_ADMIN_ROLE_SLUG } from "../src/lib/rbac-seed";
import {
  ensureSingleSuperAdmin,
  getSuperAdminEmail,
} from "../src/lib/super-admin";

const prisma = new PrismaClient();

async function main() {
  await seedRbac(prisma);

  const superAdminRoleId = await getRoleIdBySlug(prisma, SUPER_ADMIN_ROLE_SLUG);
  const adminEmail = getSuperAdminEmail();
  const adminPassword = process.env.ADMIN_PASSWORD || "SuperAdmin2026!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      roleId: superAdminRoleId,
      passwordHash,
      name: "Super Admin",
      emailVerified: true,
    },
    create: {
      email: adminEmail,
      passwordHash,
      name: "Super Admin",
      roleId: superAdminRoleId,
      emailVerified: true,
    },
  });

  await ensureSingleSuperAdmin(prisma);

  const memberRoleId = await getRoleIdBySlug(prisma, MEMBER_ROLE_SLUG);

  const settings = [
    { key: "site_name", value: "Al Khidmah Community Centre" },
    { key: "site_url", value: "https://alkhidmah.ie" },
    { key: "charity_number", value: "CHY 22345" },
    { key: "contact_address", value: "Unit 4, Monastery Road, Clondalkin, Dublin 22, D22 YX82" },
    { key: "contact_phone", value: "+353 1 457 8900" },
    { key: "contact_email", value: "info@alkhidmahmosque.ie" },
    { key: "contact_whatsapp", value: "+353851234567" },
    { key: "social_facebook", value: "https://facebook.com/alkhidmahmosque" },
    { key: "social_instagram", value: "https://instagram.com/alkhidmahmosque" },
    { key: "social_youtube", value: "https://youtube.com/@alkhidmahmosque" },
    { key: "logo_path", value: "/logo/logo.png" },
    { key: "favicon_path", value: "/favicon.svg" },
    { key: "about_values_visible", value: "true" },
    { key: "about_committee_visible", value: "true" },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  await prisma.event.deleteMany();

  await prisma.event.createMany({
    data: [
      {
        title: "Weekly Tafseer Circle",
        slug: "weekly-tafseer-circle",
        description:
          "Join us every Friday after Maghrib for a weekly tafseer circle exploring the meanings of the Quran.",
        startAt: new Date("2026-06-06T20:30:00"),
        endAt: new Date("2026-06-06T21:30:00"),
        location: "Main Prayer Hall",
        category: "lecture",
        imageUrl: IMAGES.events.tafseer,
      },
      {
        title: "Community Iftar Gathering",
        slug: "community-iftar-gathering",
        description:
          "A community iftar bringing families together with shared meals and evening prayers.",
        startAt: new Date("2026-03-15T18:00:00"),
        endAt: new Date("2026-03-15T21:00:00"),
        location: "Community Hall",
        category: "ramadan",
        imageUrl: IMAGES.events.iftar,
      },
      {
        title: "Youth Leadership Workshop",
        slug: "youth-leadership-workshop",
        description:
          "An interactive workshop helping young Muslims develop leadership and community service skills.",
        startAt: new Date("2026-04-12T14:00:00"),
        endAt: new Date("2026-04-12T17:00:00"),
        location: "Youth Room",
        category: "youth",
        imageUrl: IMAGES.events.youth,
      },
      {
        title: "Sisters' Halaqah",
        slug: "sisters-halaqah",
        description:
          "A weekly sisters' circle for Quran recitation, reflection, and community support.",
        startAt: new Date("2026-05-10T11:00:00"),
        endAt: new Date("2026-05-10T13:00:00"),
        location: "Sisters' Hall",
        category: "sisters",
        imageUrl: IMAGES.events.sisters,
      },
      {
        title: "Mosque Open Day",
        slug: "mosque-open-day",
        description:
          "Welcome neighbours and friends to learn about Islam and tour our facilities.",
        startAt: new Date("2026-08-23T11:00:00"),
        endAt: new Date("2026-08-23T15:00:00"),
        location: "Al Khidmah Community Centre",
        category: "community",
        imageUrl: IMAGES.events.openDay,
      },
    ],
  });

  await prisma.galleryItem.deleteMany();
  await prisma.galleryAlbum.deleteMany();

  const albumNames: Record<string, string> = {
    community: "Community",
    ramadan: "Ramadan",
    eid: "Eid",
    classes: "Classes",
    youth: "Youth",
  };

  const albumIds = new Map<string, string>();

  for (const label of Object.values(albumNames)) {
    const album = await prisma.galleryAlbum.create({ data: { name: label } });
    albumIds.set(label, album.id);
  }

  for (const item of GALLERY_SEED_IMAGES) {
    const albumName = albumNames[item.category] ?? "Community";
    const albumId = albumIds.get(albumName);
    if (!albumId) continue;

    await prisma.galleryItem.create({
      data: {
        albumId,
        title: item.title,
        imageUrl: item.image,
        category: item.category,
      },
    });
  }

  await prisma.class.deleteMany();

  await prisma.class.createMany({
    data: [
      {
        title: "Children's Qur'an Classes",
        slug: "childrens-quran-classes",
        description:
          "Structured Quran memorisation and tajweed for children aged 5–16, taught in a supportive and engaging environment.",
        ageGroup: "Ages 5–16",
        schedule: "Saturday 10:00–12:00 | Weekdays 17:00–18:30",
        fee: 0,
        teacher: "Ustadh Ahmed",
      },
      {
        title: "Adult Qur'an Classes",
        slug: "adult-quran-classes",
        description:
          "Quran reading, tajweed, and memorisation for adults at all levels — from beginners to advanced students.",
        ageGroup: "Adults",
        schedule: "Tuesday & Thursday 19:30–21:00",
        fee: 0,
        teacher: "Ustadh Ibrahim",
      },
      {
        title: "Arabic Language for Beginners",
        slug: "arabic-language-beginners",
        description:
          "An introductory Arabic course covering reading, writing, and basic conversational skills for everyday use.",
        ageGroup: "Teens & Adults",
        schedule: "Wednesday 18:00–19:30",
        fee: 25,
        teacher: "Ustadha Fatima",
      },
    ],
  });

  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
