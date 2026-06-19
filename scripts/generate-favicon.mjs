import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Brand emerald — high contrast with gold on light and dark browser tabs */
const BACKGROUND = "#0f6b4a";
const GOLD = "#d4af37";

const defaultSource = path.join(root, "public/logo/favicon-source.png");
const sourceArg = process.argv.find((arg) => arg.startsWith("--source="));
const sourcePath = sourceArg
  ? path.resolve(sourceArg.slice("--source=".length))
  : defaultSource;

const outputs = [
  { file: "public/logo/favicon.png", size: 512, dilate: 2, paddingRatio: 0.08 },
  { file: "public/favicon.png", size: 512, dilate: 2, paddingRatio: 0.08 },
  { file: "public/favicon-32.png", size: 32, dilate: 5, paddingRatio: 0.04 },
  { file: "src/app/icon.png", size: 32, dilate: 5, paddingRatio: 0.04 },
  { file: "src/app/apple-icon.png", size: 180, dilate: 3, paddingRatio: 0.06 },
];

function parseHexColor(hex) {
  const normalized = hex.replace("#", "");
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
    alpha: 1,
  };
}

function isGoldPixel(r, g, b, a = 255) {
  if (a < 16) {
    return false;
  }

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;

  return r >= 150 && g >= 110 && b <= 140 && saturation >= 0.25 && r >= g;
}

function dilateAlphaMask(
  pixels,
  width,
  height,
  passes,
) {
  if (passes <= 0) {
    return pixels;
  }

  let current = pixels;

  for (let pass = 0; pass < passes; pass += 1) {
    const next = new Uint8Array(current);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;
        if (current[index + 3] > 0) {
          continue;
        }

        let neighborAlpha = 0;
        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
            const nx = x + offsetX;
            const ny = y + offsetY;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
              continue;
            }

            neighborAlpha = Math.max(
              neighborAlpha,
              current[(ny * width + nx) * 4 + 3],
            );
          }
        }

        if (neighborAlpha > 0) {
          next[index + 3] = neighborAlpha;
        }
      }
    }

    current = next;
  }

  return current;
}

async function prepareIconLayer(source, dilatePasses) {
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);
  const gold = parseHexColor(GOLD);

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    if (isGoldPixel(r, g, b, a)) {
      pixels[i] = gold.r;
      pixels[i + 1] = gold.g;
      pixels[i + 2] = gold.b;
      pixels[i + 3] = 255;
    } else {
      pixels[i + 3] = 0;
    }
  }

  const dilated = dilateAlphaMask(pixels, info.width, info.height, dilatePasses);

  for (let i = 0; i < dilated.length; i += 4) {
    if (dilated[i + 3] > 0) {
      dilated[i] = gold.r;
      dilated[i + 1] = gold.g;
      dilated[i + 2] = gold.b;
      dilated[i + 3] = 255;
    }
  }

  const trimmed = await sharp(dilated, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim()
    .png()
    .toBuffer();

  return trimmed;
}

async function renderFavicon(iconLayer, size, paddingRatio) {
  const padding = Math.max(1, Math.round(size * paddingRatio));
  const iconSize = size - padding * 2;
  const background = parseHexColor(BACKGROUND);

  const icon = await sharp(iconLayer)
    .resize(iconSize, iconSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: size <= 32 ? sharp.kernel.nearest : sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: icon, gravity: "center" }])
    .png()
    .toBuffer();
}

function pngToIco(pngBuffer, dimension) {
  const headerSize = 6;
  const dirEntrySize = 16;
  const offset = headerSize + dirEntrySize;
  const ico = Buffer.alloc(offset + pngBuffer.length);

  ico.writeUInt16LE(0, 0);
  ico.writeUInt16LE(1, 2);
  ico.writeUInt16LE(1, 4);
  ico.writeUInt8(dimension >= 256 ? 0 : dimension, 6);
  ico.writeUInt8(dimension >= 256 ? 0 : dimension, 7);
  ico.writeUInt8(0, 8);
  ico.writeUInt8(0, 9);
  ico.writeUInt16LE(1, 10);
  ico.writeUInt16LE(32, 12);
  ico.writeUInt32LE(pngBuffer.length, 14);
  ico.writeUInt32LE(offset, 18);
  pngBuffer.copy(ico, offset);

  return ico;
}

async function main() {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Favicon source not found: ${sourcePath}`);
  }

  fs.mkdirSync(path.dirname(defaultSource), { recursive: true });
  if (sourcePath !== defaultSource) {
    fs.copyFileSync(sourcePath, defaultSource);
    console.log(`Saved source: ${defaultSource}`);
  }

  for (const output of outputs) {
    const iconLayer = await prepareIconLayer(sourcePath, output.dilate);
    const dest = path.join(root, output.file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const png = await renderFavicon(iconLayer, output.size, output.paddingRatio);
    await sharp(png).png().toFile(dest);
    console.log(`Generated ${output.file} (${output.size}x${output.size})`);
  }

  const favicon32Layer = await prepareIconLayer(sourcePath, 5);
  const favicon32 = await renderFavicon(favicon32Layer, 32, 0.04);
  fs.writeFileSync(path.join(root, "public/favicon.ico"), pngToIco(favicon32, 32));
  console.log("Generated public/favicon.ico");

  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Al Khidmah Community Centre">
  <rect width="512" height="512" fill="${BACKGROUND}" />
  <image href="/logo/favicon.png" width="512" height="512" preserveAspectRatio="xMidYMid meet" />
</svg>
`;
  fs.writeFileSync(path.join(root, "public/favicon.svg"), faviconSvg);
  console.log("Generated public/favicon.svg");

  console.log("Favicon assets ready.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
