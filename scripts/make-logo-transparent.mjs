import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function isBackgroundPixel(r, g, b, a) {
  if (a < 10) return true;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;

  if (max >= 175 && saturation <= 0.12) return true;
  if (r >= 240 && g >= 240 && b >= 240) return true;

  return false;
}

async function makeTransparent(input, output) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    if (isBackgroundPixel(r, g, b, a)) {
      pixels[i + 3] = 0;
    }
  }

  await sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(output);

  console.log(`Saved transparent PNG: ${output}`);
}

const cursorAssets =
  "C:\\Users\\sujan\\.cursor\\projects\\d-Exclusive-projects-Al-Khidmah-Mosque\\assets";

await makeTransparent(
  path.join(cursorAssets, "logo-transparent.png"),
  path.join(root, "public/logo/logo.png")
);
await makeTransparent(
  path.join(cursorAssets, "favicon-transparent.png"),
  path.join(root, "public/logo/favicon.png")
);
await makeTransparent(
  path.join(root, "public/logo/favicon.png"),
  path.join(root, "public/favicon.png")
);
await makeTransparent(
  path.join(root, "public/logo/favicon.png"),
  path.join(root, "src/app/apple-icon.png")
);

console.log("All logo assets updated with true transparency.");
