import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const force = process.argv.includes("--force");

/** Verified Islamic Unsplash photos (manually checked) */
const PHOTOS = {
  mosqueInterior: "photo-1744132242267-9aa633fd2f73",
  prayerHall: "photo-1761939998934-f416e51f2686",
  congregation: "photo-1547119913-19b6afce361f",
  menPraying: "photo-1574246604907-db69e30ddb97",
};

function unsplash(photoId, width, height) {
  const size = height ? `&h=${height}` : "";
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}${size}&q=85`;
}

const downloads = {
  "images/hero/masjid-hero.jpg": unsplash(PHOTOS.congregation, 1920, 1080),
  "images/heroes/about.jpg": unsplash(PHOTOS.mosqueInterior, 1920, 900),
  "images/heroes/classes.jpg": unsplash(PHOTOS.menPraying, 1920, 900),
  "images/heroes/events.jpg": unsplash(PHOTOS.congregation, 1920, 900),
  "images/heroes/gallery.jpg": unsplash(PHOTOS.mosqueInterior, 1920, 1080),
  "images/heroes/donations.jpg": unsplash(PHOTOS.congregation, 1920, 800),
  "images/heroes/contact.jpg": unsplash(PHOTOS.congregation, 1920, 1080),
  "images/classes/quran-class.jpg": unsplash(PHOTOS.menPraying, 1200, 900),
  "images/classes/adult-quran.jpg": unsplash(PHOTOS.prayerHall, 1200, 900),
  "images/classes/arabic-class.jpg": unsplash(PHOTOS.menPraying, 1200, 800),
  "images/events/community.jpg": unsplash(PHOTOS.mosqueInterior, 1200, 900),
  "images/events/tafseer.jpg": unsplash(PHOTOS.menPraying, 1200, 800),
  "images/events/open-day.jpg": unsplash(PHOTOS.congregation, 1200, 900),
  "images/events/iftar.jpg": unsplash(PHOTOS.congregation, 1200, 800),
  "images/events/ramadan.jpg": unsplash(PHOTOS.congregation, 1200, 900),
  "images/events/youth.jpg": unsplash(PHOTOS.menPraying, 1200, 800),
  "images/events/sisters.jpg": unsplash(PHOTOS.prayerHall, 1200, 900),
  "images/events/eid.jpg": unsplash(PHOTOS.congregation, 1200, 900),
  "images/events/fundraising.jpg": unsplash(PHOTOS.mosqueInterior, 1200, 800),
  "images/gallery/jumuah.jpg": unsplash(PHOTOS.congregation, 1200, 900),
  "images/gallery/ramadan.jpg": unsplash(PHOTOS.congregation, 1200, 800),
  "images/gallery/eid.jpg": unsplash(PHOTOS.menPraying, 1200, 900),
  "images/gallery/prayer-evening.jpg": unsplash(PHOTOS.prayerHall, 1200, 900),
  "images/gallery/youth.jpg": unsplash(PHOTOS.menPraying, 1200, 900),
  "images/gallery/quran.jpg": unsplash(PHOTOS.menPraying, 1200, 800),
  "images/gallery/charity.jpg": unsplash(PHOTOS.congregation, 1200, 900),
  "images/gallery/community.jpg": unsplash(PHOTOS.mosqueInterior, 1200, 800),
  "images/gallery/default.jpg": unsplash(PHOTOS.prayerHall, 1200, 900),
};

async function download(relativePath, url) {
  const dest = path.join(publicDir, relativePath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });

  if (fs.existsSync(dest) && !force) {
    console.log(`skip ${relativePath}`);
    return;
  }

  const response = await fetch(url, {
    headers: { "User-Agent": "Al-Khidmah-Mosque-Setup/1.0" },
  });
  if (!response.ok) {
    throw new Error(`Failed ${relativePath}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(dest, buffer);
  console.log(`updated ${relativePath}`);
}

async function main() {
  for (const [relativePath, url] of Object.entries(downloads)) {
    await download(relativePath, url);
  }
  console.log("Verified Islamic site images ready.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
