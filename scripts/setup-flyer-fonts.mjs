/**
 * Ensures Poppins TTF files exist under public/fonts for flyer generation.
 * Run: npm run fonts:setup-flyer
 */
import { mkdir, writeFile, access } from "fs/promises";
import path from "path";

const FONT_DIR = path.join(process.cwd(), "public", "fonts");

const FONTS = [
  {
    file: "Poppins-Regular.ttf",
    url: "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Regular.ttf",
  },
  {
    file: "Poppins-SemiBold.ttf",
    url: "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-SemiBold.ttf",
  },
  {
    file: "Poppins-Bold.ttf",
    url: "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Bold.ttf",
  },
];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(FONT_DIR, { recursive: true });

  for (const font of FONTS) {
    const target = path.join(FONT_DIR, font.file);
    if (await exists(target)) {
      console.log(`OK  ${font.file}`);
      continue;
    }

    const response = await fetch(font.url);
    if (!response.ok) {
      throw new Error(`Failed to download ${font.file} (${response.status})`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(target, buffer);
    console.log(`Saved ${font.file}`);
  }

  console.log("Flyer fonts ready.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
