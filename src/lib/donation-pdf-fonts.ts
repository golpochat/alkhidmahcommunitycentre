import "server-only";

import { readFile } from "fs/promises";
import path from "path";
import fontkit from "@pdf-lib/fontkit";
import type { PDFDocument } from "pdf-lib";

const FONT_DIR = path.join(process.cwd(), "public", "fonts");

const FONT_FILES = {
  regular: "Poppins-Regular.ttf",
  bold: "Poppins-SemiBold.ttf",
} as const;

const fontBytesCache = new Map<string, Uint8Array>();

async function loadFontBytes(filename: string) {
  const cached = fontBytesCache.get(filename);
  if (cached) {
    return cached;
  }

  const filePath = path.join(FONT_DIR, filename);
  const buffer = await readFile(filePath);
  const bytes = new Uint8Array(buffer);
  fontBytesCache.set(filename, bytes);
  return bytes;
}

/** Embed Poppins so donation PDFs can render the euro (€) symbol and other Unicode text. */
export async function embedDonationPdfFonts(pdfDoc: PDFDocument) {
  pdfDoc.registerFontkit(fontkit);

  const [regularBytes, boldBytes] = await Promise.all([
    loadFontBytes(FONT_FILES.regular),
    loadFontBytes(FONT_FILES.bold),
  ]);

  const font = await pdfDoc.embedFont(regularBytes);
  const fontBold = await pdfDoc.embedFont(boldBytes);

  return { font, fontBold };
}
