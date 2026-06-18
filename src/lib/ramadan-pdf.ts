import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  getDonationStatementBranding,
  loadStatementLogoPng,
  type DonationStatementBranding,
} from "@/lib/donation-statement-branding";
import {
  activeRamadanPaymentQrs,
  listRamadanPaymentQrs,
} from "@/lib/ramadan-payment-qr";
import {
  BRAND_GOLD,
  BRAND_GREEN,
  buildTimetableLetterheadOptions,
  drawLetterhead,
  drawPdfTitleSection,
  embedStandardFonts,
  getPdfFontVerticalMetrics,
  LETTERHEAD_LOGO_MAX_HEIGHT,
  PDF_LETTERHEAD_FONT_SCALE,
  PDF_LETTERHEAD_LOGO_SCALE,
  PDF_MARGIN,
  PDF_PAGE,
  PDF_SECTION_GAP,
  PDF_TITLE_FONT_SIZE,
  toPdfSafeText,
  type PdfFonts,
} from "@/lib/donation-pdf-layout";
import {
  formatRamadanArabicSubtitle,
  formatRamadanDayAndDate,
  formatRamadanDayNumber,
  formatRamadanTime,
  formatRamadanTimetableTitle,
  isRamadanEvenNightHighlight,
} from "@/lib/ramadan-format";
import { isHijriRamadanStorageYear } from "@/lib/ramadan-season-types";
import { getRamadanPdfDisplayYear } from "@/lib/ramadan-seasons";
import {
  parseRamadanNotesForPdf,
  type RamadanPdfNoteBlock,
  type RamadanPdfTextRun,
} from "@/lib/ramadan-notes-html";
import {
  RAMADAN_QR_MAX_SLOTS,
  type RamadanPaymentQRItem,
  type RamadanSettingsData,
} from "@/lib/ramadan-settings-types";
import {
  ensureThirtyRamadanRows,
  type RamadanDayRow,
} from "@/lib/ramadan-timetable";
import { generateQrPngBytes } from "@/lib/qr";

const FRAME = {
  inner: 24,
  pad: 6,
  rule: 0.75,
} as const;

const QR_BOX_PAD = 5;
const TABLE_AFTER_GAP = 4;

const CONTENT_LEFT = FRAME.inner + FRAME.pad;
const CONTENT_RIGHT = PDF_PAGE.width - CONTENT_LEFT;
const CONTENT_BOTTOM = FRAME.inner + FRAME.pad;
const RAMADAN_HEADER_START_Y = PDF_PAGE.height - PDF_MARGIN;
const CONTENT_WIDTH = CONTENT_RIGHT - CONTENT_LEFT;
const TABLE_BORDER = 0.5;
const TABLE_DATA_FONT_SCALE = 1.03;
/** Compact QR footer vs measured layout height. */
const RAMADAN_QR_FOOTER_HEIGHT_SCALE = 0.75;

const RAMADAN_PDF_HEADERS = [
  "Ramadan",
  "Date",
  "Suhoor",
  "Fajr",
  "Sunrise",
  "Dhuhr",
  "Asr",
  "Maghrib",
  "Isha",
] as const;
const RAMADAN_COLUMN_WEIGHTS = [9, 17, 6, 6, 6, 6, 6, 6, 7];
const ROW_HIGHLIGHT_FILL = rgb(0.96, 0.92, 0.78);

interface RamadanPdfLayout {
  titleSize: number;
  subtitleSize: number;
  tableHeaderSize: number;
  tableBodySize: number;
  rowHeight: number;
  notesBodySize: number;
  notesLineHeight: number;
  notesMaxLines: number;
  qrSize: number;
  qrColumns: number;
  qrLabelSize: number;
  qrRowGap: number;
  sectionGap: number;
}

function getColumnWidths(weights: number[]) {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => (CONTENT_WIDTH * weight) / totalWeight);
}

function buildColumnPositions(colWidths: number[]) {
  const positions: number[] = [];
  let x = CONTENT_LEFT;

  for (const width of colWidths) {
    positions.push(x);
    x += width;
  }

  return positions;
}

function pdfText(value: string) {
  return toPdfSafeText(value || "—");
}

function drawPageFrame(page: PDFPage) {
  page.drawRectangle({
    x: FRAME.inner,
    y: FRAME.inner,
    width: PDF_PAGE.width - FRAME.inner * 2,
    height: PDF_PAGE.height - FRAME.inner * 2,
    borderColor: BRAND_GOLD,
    borderWidth: 2,
  });
}

type RamadanPdfFonts = PdfFonts & {
  fontItalic: PDFFont;
  fontBoldItalic: PDFFont;
};

async function embedRamadanPdfFonts(pdfDoc: PDFDocument): Promise<RamadanPdfFonts> {
  const base = await embedStandardFonts(pdfDoc);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontBoldItalic = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
  return { ...base, fontItalic, fontBoldItalic };
}

function fontForStyledWord(
  word: { bold?: boolean; italic?: boolean },
  fonts: RamadanPdfFonts,
) {
  if (word.bold && word.italic) return fonts.fontBoldItalic;
  if (word.bold) return fonts.fontBold;
  if (word.italic) return fonts.fontItalic;
  return fonts.font;
}

type StyledWord = { word: string; bold?: boolean; italic?: boolean };

type PdfNoteLine = {
  words: StyledWord[];
  justify: boolean;
  align: RamadanPdfNoteBlock["align"];
};

function lineWordsWidth(
  words: StyledWord[],
  fonts: RamadanPdfFonts,
  size: number,
) {
  const spaceWidth = fonts.font.widthOfTextAtSize(" ", size);
  return words.reduce((sum, word, index) => {
    const font = fontForStyledWord(word, fonts);
    const wordWidth = font.widthOfTextAtSize(word.word, size);
    return sum + wordWidth + (index > 0 ? spaceWidth : 0);
  }, 0);
}

function shouldJustifyPdfNoteLine(
  lineWords: StyledWord[],
  fonts: RamadanPdfFonts,
  size: number,
  maxWidth: number,
  lineIndex: number,
  lineCount: number,
  align: RamadanPdfNoteBlock["align"],
) {
  if (align !== "justify" || lineWords.length < 2) return false;
  if (lineIndex === lineCount - 1) return false;

  const lineWidth = lineWordsWidth(lineWords, fonts, size);
  return lineWidth >= maxWidth * 0.92;
}

function runsToWords(runs: RamadanPdfTextRun[]): StyledWord[] {
  const words: StyledWord[] = [];

  for (const run of runs) {
    const chunks = run.text.split(/(\s+)/);
    for (const chunk of chunks) {
      if (!chunk || /^\s+$/.test(chunk)) continue;
      words.push({
        word: pdfText(chunk),
        bold: run.bold,
        italic: run.italic,
      });
    }
  }

  return words;
}

function splitRunsOnNewlines(runs: RamadanPdfTextRun[]): RamadanPdfTextRun[][] {
  const paragraphs: RamadanPdfTextRun[][] = [[]];

  for (const run of runs) {
    const parts = run.text.split("\n");
    parts.forEach((part, index) => {
      if (part) {
        paragraphs[paragraphs.length - 1].push({
          text: part,
          bold: run.bold,
          italic: run.italic,
        });
      }
      if (index < parts.length - 1) {
        paragraphs.push([]);
      }
    });
  }

  return paragraphs;
}

function wrapStyledWords(
  words: StyledWord[],
  fonts: RamadanPdfFonts,
  size: number,
  maxWidth: number,
) {
  const lines: StyledWord[][] = [];
  let current: StyledWord[] = [];
  let currentWidth = 0;
  const spaceWidth = fonts.font.widthOfTextAtSize(" ", size);

  for (const word of words) {
    const font = fontForStyledWord(word, fonts);
    const wordWidth = font.widthOfTextAtSize(word.word, size);
    const nextWidth =
      current.length === 0 ? wordWidth : currentWidth + spaceWidth + wordWidth;

    if (current.length > 0 && nextWidth > maxWidth) {
      lines.push(current);
      current = [word];
      currentWidth = wordWidth;
      continue;
    }

    current.push(word);
    currentWidth = nextWidth;
  }

  if (current.length > 0) {
    lines.push(current);
  }

  return lines;
}

function layoutPdfNoteBlocks(
  blocks: RamadanPdfNoteBlock[],
  fonts: RamadanPdfFonts,
  size: number,
  maxWidth: number,
) {
  const lines: PdfNoteLine[] = [];

  blocks.forEach((block, blockIndex) => {
    const hasVisibleText = block.runs.some(
      (run) => run.text.replace(/\n/g, "").trim().length > 0,
    );

    if (!hasVisibleText) {
      lines.push({ words: [], justify: false, align: block.align });
      if (blockIndex < blocks.length - 1) {
        lines.push({ words: [], justify: false, align: "left" });
      }
      return;
    }

    const paragraphs = splitRunsOnNewlines(block.runs);

    paragraphs.forEach((paragraphRuns, paragraphIndex) => {
      if (paragraphRuns.length === 0) {
        lines.push({ words: [], justify: false, align: block.align });
      } else {
        const wrapped = wrapStyledWords(
          runsToWords(paragraphRuns),
          fonts,
          size,
          maxWidth,
        );

        wrapped.forEach((lineWords, lineIndex) => {
          lines.push({
            words: lineWords,
            align: block.align,
            justify: shouldJustifyPdfNoteLine(
              lineWords,
              fonts,
              size,
              maxWidth,
              lineIndex,
              wrapped.length,
              block.align,
            ),
          });
        });
      }

      if (paragraphIndex < paragraphs.length - 1) {
        lines.push({ words: [], justify: false, align: block.align });
      }
    });

    if (blockIndex < blocks.length - 1) {
      lines.push({ words: [], justify: false, align: "left" });
    }
  });

  return lines;
}

function drawPdfNoteLine(
  page: PDFPage,
  line: PdfNoteLine,
  y: number,
  size: number,
  fonts: RamadanPdfFonts,
) {
  const color = rgb(0.1, 0.1, 0.1);

  if (line.words.length === 0) {
    return;
  }

  const spaceWidth = fonts.font.widthOfTextAtSize(" ", size);
  const wordsWidth = lineWordsWidth(line.words, fonts, size);

  if (line.justify) {
    const gaps = line.words.length - 1;
    const gap = gaps > 0 ? (CONTENT_WIDTH - wordsWidth) / gaps : 0;
    let x = CONTENT_LEFT;

    line.words.forEach((word, index) => {
      const font = fontForStyledWord(word, fonts);
      page.drawText(word.word, { x, y, size, font, color });
      x +=
        font.widthOfTextAtSize(word.word, size) +
        (index < line.words.length - 1 ? Math.max(gap, spaceWidth) : 0);
    });
    return;
  }

  let x = CONTENT_LEFT;
  if (line.align === "center") {
    x = CONTENT_LEFT + (CONTENT_WIDTH - wordsWidth) / 2;
  } else if (line.align === "right") {
    x = CONTENT_RIGHT - wordsWidth;
  }

  for (const word of line.words) {
    const font = fontForStyledWord(word, fonts);
    page.drawText(word.word, { x, y, size, font, color });
    x += font.widthOfTextAtSize(word.word, size) + spaceWidth;
  }
}

function drawCenteredText(
  page: PDFPage,
  text: string,
  y: number,
  size: number,
  font: PdfFonts["font"],
  color = BRAND_GREEN,
) {
  const safe = pdfText(text);
  const width = font.widthOfTextAtSize(safe, size);
  page.drawText(safe, {
    x: (PDF_PAGE.width - width) / 2,
    y,
    size,
    font,
    color,
  });
}

/** Draw a line with its top edge at yTop; returns y below the line. */
function drawCenteredTextFromTop(
  page: PDFPage,
  text: string,
  yTop: number,
  size: number,
  font: PdfFonts["font"],
  color = BRAND_GREEN
) {
  drawCenteredText(page, text, yTop - size, size, font, color);
  return yTop - size;
}

const RAMADAN_TITLE_SUBTITLE_GAP = 4;
const RAMADAN_TITLE_TABLE_GAP = 4;
const RAMADAN_TABLE_HEADER_PAD = 4;

function ramadanTableHeaderRowHeight(
  tableHeaderSize: number,
  font?: PdfFonts["font"],
) {
  const metrics = font
    ? getPdfFontVerticalMetrics(font, tableHeaderSize)
    : {
        ascent: tableHeaderSize * 0.72,
        descent: tableHeaderSize * 0.28,
      };

  return (
    RAMADAN_TABLE_HEADER_PAD +
    metrics.ascent +
    metrics.descent +
    RAMADAN_TABLE_HEADER_PAD
  );
}

function measureHeaderHeight(
  hasLogo: boolean,
  layout: RamadanPdfLayout,
  fonts: PdfFonts,
) {
  const fontScale = PDF_LETTERHEAD_FONT_SCALE;
  const siteNameLineHeight = 16 * fontScale;
  const contactLineHeight = 10 * fontScale;
  const logoHeight = hasLogo
    ? LETTERHEAD_LOGO_MAX_HEIGHT * PDF_LETTERHEAD_LOGO_SCALE
    : 0;
  const contactHeight = siteNameLineHeight + contactLineHeight * 3;
  const blockHeight = Math.max(logoHeight, contactHeight);
  const titleMetrics = getPdfFontVerticalMetrics(
    fonts.fontBold,
    PDF_TITLE_FONT_SIZE,
  );
  const subtitleMetrics = getPdfFontVerticalMetrics(
    fonts.fontBold,
    layout.subtitleSize,
  );
  const titleBetweenRulesHeight = titleMetrics.ascent + titleMetrics.descent;
  const subtitleBlockHeight = subtitleMetrics.ascent + subtitleMetrics.descent;

  return (
    PDF_SECTION_GAP +
    blockHeight +
    PDF_SECTION_GAP * 2 +
    titleBetweenRulesHeight +
    RAMADAN_TITLE_SUBTITLE_GAP +
    subtitleBlockHeight +
    RAMADAN_TITLE_TABLE_GAP
  );
}

function measureQrRowSetsHeight(qrCount: number, layout: RamadanPdfLayout) {
  const qrBoxHeight = layout.qrSize + QR_BOX_PAD * 2;
  const labelGap = 4 * RAMADAN_QR_FOOTER_HEIGHT_SCALE;
  return qrBoxHeight + labelGap + layout.qrLabelSize;
}

function measureQrSectionHeight(qrCount: number, layout: RamadanPdfLayout) {
  if (qrCount === 0) return 0;

  const gap = layout.sectionGap;
  const headingRuleHeight = FRAME.rule + gap;

  const baseHeight =
    gap +
    layout.qrLabelSize +
    gap +
    headingRuleHeight +
    measureQrRowSetsHeight(qrCount, layout) +
    gap;

  return baseHeight * RAMADAN_QR_FOOTER_HEIGHT_SCALE;
}

function measureNotesLines(
  notes: string,
  layout: RamadanPdfLayout,
  fonts: RamadanPdfFonts,
) {
  const blocks = parseRamadanNotesForPdf(notes);
  if (blocks.length === 0) return [];

  return layoutPdfNoteBlocks(blocks, fonts, layout.notesBodySize, CONTENT_WIDTH);
}

function measureTableAfterRuleHeight(layout: RamadanPdfLayout) {
  return TABLE_AFTER_GAP + layout.sectionGap;
}

function measureNotesHeight(lineCount: number, layout: RamadanPdfLayout) {
  if (lineCount === 0) return 0;

  return layout.sectionGap + lineCount * layout.notesLineHeight + 4;
}

function syncRamadanNotesMetrics(layout: RamadanPdfLayout) {
  layout.notesLineHeight = Math.max(8, layout.notesBodySize * 1.12);
}

function applyRamadanTableMetrics(layout: RamadanPdfLayout, rowHeight: number) {
  layout.rowHeight = Math.max(9.5, rowHeight);
  layout.tableBodySize = Math.min(
    11.5,
    Math.max(9, layout.rowHeight * 0.82),
  );
  layout.tableHeaderSize = Math.min(11.5, layout.tableBodySize + 0.5);
  layout.notesBodySize = Math.min(
    10,
    Math.max(7.5, layout.tableBodySize - 0.75),
  );
  syncRamadanNotesMetrics(layout);
}

function buildLayout(qrCount: number): RamadanPdfLayout {
  return {
    titleSize: PDF_TITLE_FONT_SIZE,
    subtitleSize: 13,
    tableHeaderSize: 11,
    tableBodySize: 10.5,
    rowHeight: 10.5,
    notesBodySize: 9.5,
    notesLineHeight: 11,
    notesMaxLines: 999,
    qrSize: 38,
    qrColumns: Math.min(qrCount, RAMADAN_QR_MAX_SLOTS) || RAMADAN_QR_MAX_SLOTS,
    qrLabelSize: 8.5,
    qrRowGap: 3,
    sectionGap: PDF_SECTION_GAP,
  };
}

function fitLayoutToPage(
  layout: RamadanPdfLayout,
  input: {
    rowCount: number;
    notes: string;
    qrCount: number;
    hasLogo: boolean;
    fonts: RamadanPdfFonts;
  },
) {
  const allNoteLines = measureNotesLines(input.notes, layout, input.fonts);
  const qrHeight = measureQrSectionHeight(input.qrCount, layout);
  const headerHeight = measureHeaderHeight(input.hasLogo, layout, input.fonts);
  const tableAfterRuleHeight = measureTableAfterRuleHeight(layout);
  const pageContentHeight = RAMADAN_HEADER_START_Y - CONTENT_BOTTOM;
  const contentMargin = layout.sectionGap;

  let notesLines = allNoteLines.length;

  for (let attempt = 0; attempt < 48; attempt += 1) {
    syncRamadanNotesMetrics(layout);
    const tableHeaderSpace = ramadanTableHeaderRowHeight(
      layout.tableHeaderSize,
      input.fonts.fontBold,
    );
    const notesHeight = measureNotesHeight(notesLines, layout);
    const tableDataHeight =
      pageContentHeight -
      headerHeight -
      tableHeaderSpace -
      tableAfterRuleHeight -
      notesHeight -
      qrHeight -
      contentMargin;
    const rowHeight = tableDataHeight / Math.max(input.rowCount, 1);

    applyRamadanTableMetrics(layout, rowHeight);

    const usedHeight =
      headerHeight +
      tableHeaderSpace +
      input.rowCount * layout.rowHeight +
      tableAfterRuleHeight +
      measureNotesHeight(notesLines, layout) +
      qrHeight +
      contentMargin;

    if (usedHeight <= pageContentHeight && rowHeight >= 9.5) {
      layout.notesMaxLines = notesLines;
      const slack = pageContentHeight - usedHeight;
      if (slack > 0.5) {
        layout.rowHeight += slack / Math.max(input.rowCount, 1);
        layout.tableBodySize = Math.min(
          11.5,
          Math.max(9, layout.rowHeight * 0.82),
        );
        layout.tableHeaderSize = Math.min(11.5, layout.tableBodySize + 0.5);
      }
      return layout;
    }

    if (layout.notesBodySize > 7.5) {
      layout.notesBodySize -= 0.25;
      continue;
    }

    if (notesLines > 2 && allNoteLines.length > 2) {
      notesLines -= 1;
      continue;
    }

    if (layout.qrSize > 32) {
      layout.qrSize -= 2;
      layout.qrLabelSize = Math.max(7, layout.qrLabelSize - 0.25);
      continue;
    }

    layout.notesMaxLines = Math.max(2, notesLines);
    return layout;
  }

  layout.notesMaxLines = Math.max(2, notesLines);
  return layout;
}

async function drawRamadanPdfHeader(
  pdfDoc: PDFDocument,
  page: PDFPage,
  yStart: number,
  logoPng: Uint8Array | null,
  fonts: PdfFonts,
  branding: DonationStatementBranding,
  year: number,
  hijriYear: number | null | undefined,
  layout: RamadanPdfLayout,
) {
  const { fontBold } = fonts;
  const subtitleMetrics = getPdfFontVerticalMetrics(
    fontBold,
    layout.subtitleSize,
  );

  let y = await drawLetterhead(
    pdfDoc,
    page,
    yStart - PDF_SECTION_GAP,
    branding,
    fonts,
    logoPng,
    buildTimetableLetterheadOptions({
      pageWidth: PDF_PAGE.width,
      margin: CONTENT_LEFT,
    }),
  );

  y = drawPdfTitleSection(
    page,
    formatRamadanTimetableTitle(year),
    y,
    fonts,
    {
      pageWidth: PDF_PAGE.width,
      margin: CONTENT_LEFT,
      titleSize: PDF_TITLE_FONT_SIZE,
      sectionGap: PDF_SECTION_GAP,
      align: "left",
      drawBottomRule: false,
    },
  );

  const subtitleBaseline =
    y - RAMADAN_TITLE_SUBTITLE_GAP - subtitleMetrics.ascent;
  drawCenteredText(
    page,
    formatRamadanArabicSubtitle(hijriYear),
    subtitleBaseline,
    layout.subtitleSize,
    fontBold,
    BRAND_GOLD,
  );

  return subtitleBaseline - subtitleMetrics.descent - RAMADAN_TITLE_TABLE_GAP;
}

function drawHighlightedTableRows(
  page: PDFPage,
  rows: RamadanDayRow[],
  headerBottomY: number,
  rowHeight: number,
) {
  rows.forEach((row, index) => {
    if (!isRamadanEvenNightHighlight(row.hijriDay)) return;

    const rowTop = headerBottomY - index * rowHeight;
    const rowBottom = rowTop - rowHeight;

    page.drawRectangle({
      x: CONTENT_LEFT,
      y: rowBottom,
      width: CONTENT_WIDTH,
      height: rowHeight,
      color: ROW_HIGHLIGHT_FILL,
    });
  });
}

function tableDataFontSize(layout: RamadanPdfLayout) {
  return layout.tableBodySize * TABLE_DATA_FONT_SCALE;
}

function drawTableGrid(
  page: PDFPage,
  topY: number,
  headerBottomY: number,
  bottomY: number,
  colWidths: number[],
  rowCount: number,
  rowHeight: number,
) {
  page.drawRectangle({
    x: CONTENT_LEFT,
    y: bottomY,
    width: CONTENT_WIDTH,
    height: topY - bottomY,
    borderColor: BRAND_GOLD,
    borderWidth: TABLE_BORDER,
  });

  let x = CONTENT_LEFT;
  for (let index = 0; index < colWidths.length - 1; index += 1) {
    x += colWidths[index];
    page.drawLine({
      start: { x, y: bottomY },
      end: { x, y: topY },
      thickness: TABLE_BORDER,
      color: BRAND_GOLD,
    });
  }

  page.drawLine({
    start: { x: CONTENT_LEFT, y: headerBottomY },
    end: { x: CONTENT_RIGHT, y: headerBottomY },
    thickness: TABLE_BORDER,
    color: BRAND_GOLD,
  });

  for (let rowIndex = 1; rowIndex < rowCount; rowIndex += 1) {
    const y = headerBottomY - rowIndex * rowHeight;
    page.drawLine({
      start: { x: CONTENT_LEFT, y },
      end: { x: CONTENT_RIGHT, y },
      thickness: TABLE_BORDER,
      color: BRAND_GOLD,
    });
  }
}

function drawTableHeaders(
  page: PDFPage,
  y: number,
  colX: number[],
  fonts: PdfFonts,
  fontSize: number,
) {
  const { fontBold } = fonts;
  RAMADAN_PDF_HEADERS.forEach((header, index) => {
    page.drawText(pdfText(header), {
      x: colX[index] + 2,
      y,
      size: fontSize,
      font: fontBold,
      color: BRAND_GOLD,
    });
  });
}

function drawTableRow(
  page: PDFPage,
  y: number,
  values: string[],
  colX: number[],
  font: PdfFonts["font"],
  fontSize: number,
) {
  values.forEach((value, index) => {
    page.drawText(pdfText(value), {
      x: colX[index] + 2,
      y,
      size: fontSize,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
  });
}

function drawNotesSection(
  page: PDFPage,
  yTop: number,
  body: string,
  fonts: RamadanPdfFonts,
  layout: RamadanPdfLayout,
) {
  let y = yTop;
  const blocks = parseRamadanNotesForPdf(body);
  const lines = layoutPdfNoteBlocks(
    blocks,
    fonts,
    layout.notesBodySize,
    CONTENT_WIDTH,
  );
  const visibleLines = lines.slice(0, layout.notesMaxLines);

  for (const line of visibleLines) {
    drawPdfNoteLine(page, line, y, layout.notesBodySize, fonts);
    y -= layout.notesLineHeight;
  }

  return y;
}

async function embedPaymentQrImage(
  pdfDoc: PDFDocument,
  item: RamadanPaymentQRItem,
) {
  if (item.qrImage?.startsWith("data:image/png;base64,")) {
    const base64 = item.qrImage.split(",")[1];
    return pdfDoc.embedPng(Buffer.from(base64, "base64"));
  }
  const qrBytes = await generateQrPngBytes(item.url, 320);
  return pdfDoc.embedPng(qrBytes);
}

async function drawQrDonationSectionAtBottom(
  pdfDoc: PDFDocument,
  page: PDFPage,
  items: RamadanPaymentQRItem[],
  fonts: RamadanPdfFonts,
  layout: RamadanPdfLayout,
) {
  const { fontBold } = fonts;
  if (items.length === 0) return;

  const gap = layout.sectionGap * RAMADAN_QR_FOOTER_HEIGHT_SCALE;
  const sectionHeight = measureQrSectionHeight(items.length, layout);
  let y = CONTENT_BOTTOM + sectionHeight;

  drawCenteredText(
    page,
    "Donate by QR Code",
    y,
    layout.qrLabelSize + 1,
    fontBold,
    BRAND_GREEN,
  );
  y -= layout.qrLabelSize + gap / 2;

  page.drawLine({
    start: { x: CONTENT_LEFT, y },
    end: { x: CONTENT_RIGHT, y },
    thickness: FRAME.rule,
    color: BRAND_GOLD,
  });
  y -= gap / 2 + FRAME.rule;

  const columnWidth = CONTENT_WIDTH / layout.qrColumns;
    const labelGap = 4 * RAMADAN_QR_FOOTER_HEIGHT_SCALE;
  const boxWidth = layout.qrSize + QR_BOX_PAD * 2;
  const boxHeight = layout.qrSize + QR_BOX_PAD * 2;
  const rowTopY = y;

  for (let columnIndex = 0; columnIndex < layout.qrColumns; columnIndex += 1) {
    const item = items[columnIndex];
    if (!item) continue;

    const slotCenterX =
      CONTENT_LEFT + columnWidth * columnIndex + columnWidth / 2;
    const boxX = slotCenterX - boxWidth / 2;
    const boxTopY = rowTopY;
    const boxBottomY = boxTopY - boxHeight;

    page.drawRectangle({
      x: boxX,
      y: boxBottomY,
      width: boxWidth,
      height: boxHeight,
      borderColor: BRAND_GOLD,
      borderWidth: 1,
    });

    const qrX = slotCenterX - layout.qrSize / 2;
    const qrY = boxTopY - QR_BOX_PAD - layout.qrSize;

    const qrImage = await embedPaymentQrImage(pdfDoc, item);
    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: layout.qrSize,
      height: layout.qrSize,
    });

    const label = pdfText(item.category);
    const labelWidth = fontBold.widthOfTextAtSize(label, layout.qrLabelSize);
    page.drawText(label, {
      x: slotCenterX - labelWidth / 2,
      y: boxBottomY - labelGap - layout.qrLabelSize,
      size: layout.qrLabelSize,
      font: fontBold,
      color: BRAND_GREEN,
    });
  }
}

export async function renderRamadanTimetablePdf(input: {
  year: number;
  hijriYear?: number | null;
  startDate: string;
  endDate: string;
  rows: RamadanDayRow[];
  settings: RamadanSettingsData;
  paymentQrs?: RamadanPaymentQRItem[];
}) {
  const branding = await getDonationStatementBranding();
  const logoPng = await loadStatementLogoPng(branding.logoPath);
  const rows = ensureThirtyRamadanRows(input.rows);
  const paymentItems =
    input.paymentQrs ??
    activeRamadanPaymentQrs(
      await listRamadanPaymentQrs(input.year, input.settings.qrSlotCount),
      input.settings.qrSlotCount,
    );
  const pdfDoc = await PDFDocument.create();
  const fonts = await embedRamadanPdfFonts(pdfDoc);
  const { font, fontBold } = fonts;
  const notes = input.settings.notesMessage.trim();
  const baseLayout = buildLayout(paymentItems.length);
  const layout = fitLayoutToPage(baseLayout, {
    rowCount: rows.length,
    notes,
    qrCount: paymentItems.length,
    hasLogo: Boolean(logoPng),
    fonts,
  });
  const colWidths = getColumnWidths(RAMADAN_COLUMN_WEIGHTS);
  const colX = buildColumnPositions(colWidths);
  const titleGregorianYear = isHijriRamadanStorageYear(input.year)
    ? getRamadanPdfDisplayYear(input.year, {
        startDate: input.startDate,
        endDate: input.endDate,
      })
    : input.year;

  const page = pdfDoc.addPage([PDF_PAGE.width, PDF_PAGE.height]);
  drawPageFrame(page);

  let y = RAMADAN_HEADER_START_Y;
  y = await drawRamadanPdfHeader(
    pdfDoc,
    page,
    y,
    logoPng,
    fonts,
    branding,
    titleGregorianYear,
    input.hijriYear ?? (isHijriRamadanStorageYear(input.year) ? input.year : null),
    layout,
  );

  const tableTopY = y;
  const headerRowHeight = ramadanTableHeaderRowHeight(
    layout.tableHeaderSize,
    fontBold,
  );
  const headerMetrics = getPdfFontVerticalMetrics(
    fontBold,
    layout.tableHeaderSize,
  );
  const gridTopY = tableTopY;
  const headerBottomY = gridTopY - headerRowHeight;
  const headerTextY = gridTopY - RAMADAN_TABLE_HEADER_PAD - headerMetrics.ascent;
  drawTableHeaders(page, headerTextY, colX, fonts, layout.tableHeaderSize);
  const tableBottomY = headerBottomY - rows.length * layout.rowHeight;

  drawHighlightedTableRows(page, rows, headerBottomY, layout.rowHeight);

  rows.forEach((row, index) => {
    const dataFontSize = tableDataFontSize(layout);
    const rowY =
      headerBottomY -
      (index + 1) * layout.rowHeight +
      dataFontSize * 0.35;
    drawTableRow(
      page,
      rowY,
      [
        formatRamadanDayNumber(row.hijriDay, row.hijriDate),
        formatRamadanDayAndDate(row.dayName, row.date),
        formatRamadanTime(row.suhoorEnd),
        formatRamadanTime(row.fajr),
        formatRamadanTime(row.sunrise),
        formatRamadanTime(row.dhuhr),
        formatRamadanTime(row.asr),
        formatRamadanTime(row.maghrib),
        formatRamadanTime(row.isha),
      ],
      colX,
      row.isFriday ? fontBold : font,
      dataFontSize,
    );
  });

  drawTableGrid(
    page,
    gridTopY,
    headerBottomY,
    tableBottomY,
    colWidths,
    rows.length,
    layout.rowHeight,
  );

  if (notes) {
    const notesTop = tableBottomY - TABLE_AFTER_GAP - layout.sectionGap;
    drawNotesSection(page, notesTop, notes, fonts, layout);
  }

  await drawQrDonationSectionAtBottom(
    pdfDoc,
    page,
    paymentItems,
    fonts,
    layout,
  );

  return pdfDoc.save();
}
