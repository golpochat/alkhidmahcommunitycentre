import "server-only";

import { format } from "date-fns";
import { PDFDocument, rgb, type PDFPage } from "pdf-lib";
import {
  getDonationStatementBranding,
  loadStatementLogoPng,
} from "@/lib/donation-statement-branding";
import {
  BRAND_GOLD,
  BRAND_GREEN,
  buildTimetableLetterheadOptions,
  drawLetterhead,
  drawPdfTitleSection,
  embedStandardFonts,
  PDF_MARGIN,
  PDF_PAGE,
  PDF_SECTION_GAP,
  PDF_TITLE_FONT_SIZE,
  toPdfSafeText,
  type PdfFonts,
} from "@/lib/donation-pdf-layout";
import type { MonthlyDayRow } from "@/lib/monthly-timetable";
import type { RamadanDayRow } from "@/lib/ramadan-timetable";
import type {
  RamadanPaymentQRItem,
  RamadanSettingsData,
} from "@/lib/ramadan-settings-types";
import { renderRamadanTimetablePdf } from "@/lib/ramadan-pdf";
import { parseDateKey } from "@/lib/prayer-times-pure";
import { generateQrPngBytes } from "@/lib/qr";

const MONTHLY_PDF_PAGE = {
  width: PDF_PAGE.height,
  height: PDF_PAGE.width,
};

const MONTHLY_FONT_SCALE = 1.1;
const MONTHLY_PAGE_BOTTOM_RESERVE = 28;

const MONTHLY_COLUMN_WEIGHTS = [8, 10, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7];

const MONTHLY_HEADER_ROW1 = [
  { label: "Date", startCol: 0, span: 1 },
  { label: "Day", startCol: 1, span: 1 },
  { label: "Fajr", startCol: 2, span: 2 },
  { label: "Sunrise", startCol: 4, span: 1 },
  { label: "Dhuhr", startCol: 5, span: 2 },
  { label: "Asr", startCol: 7, span: 2 },
  { label: "Maghrib", startCol: 9, span: 2 },
  { label: "Isha", startCol: 11, span: 2 },
] as const;

const MONTHLY_HEADER_ROW2 = [
  "",
  "",
  "Adhan",
  "Iqama",
  "",
  "Adhan",
  "Iqama",
  "Adhan",
  "Iqama",
  "Adhan",
  "Iqama",
  "Adhan",
  "Iqama",
] as const;

type MonthlyHeaderAlign = "left" | "center";

function monthlyHeaderRow1Align(
  label: string,
  span: number,
): MonthlyHeaderAlign {
  if (span > 1) {
    return "center";
  }
  return label === "Date" || label === "Day" ? "left" : "center";
}

function monthlyColumnAlign(columnIndex: number): MonthlyHeaderAlign {
  return columnIndex < 2 ? "left" : "center";
}

function buildColumnLayout(
  pageWidth: number,
  margin: number,
  weights: number[],
) {
  const contentWidth = pageWidth - margin * 2;
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const widths = weights.map((weight) => (contentWidth * weight) / totalWeight);
  const positions: number[] = [];
  let x = margin;

  for (const width of widths) {
    positions.push(x);
    x += width;
  }

  return { positions, widths };
}

function drawGoldBorder(page: PDFPage, width: number, height: number) {
  page.drawRectangle({
    x: 18,
    y: 18,
    width: width - 36,
    height: height - 36,
    borderColor: BRAND_GOLD,
    borderWidth: 2,
  });
}

function computeMonthlyTableMetrics(
  tableTopY: number,
  rowCount: number,
  baseFontSize: number,
  footerReserve: number,
  headerTopGap: number,
  headerBottomGap: number,
) {
  const headerFontSize = baseFontSize;
  const rowGap = headerFontSize + 3;
  const headerBlockHeight =
    headerTopGap + headerFontSize + rowGap + headerFontSize + headerBottomGap;
  const tableDataBottomY = footerReserve;
  const availableDataHeight = tableTopY - headerBlockHeight - tableDataBottomY;
  const rowHeight = availableDataHeight / Math.max(rowCount, 1);
  const fontSize = Math.min(baseFontSize, rowHeight * 0.72);

  return {
    fontSize,
    headerFontSize,
    rowHeight,
    headerBlockHeight,
    rowGap,
  };
}

function pdfText(value: string) {
  return toPdfSafeText(value || "—");
}

function drawAlignedHeaderText(
  page: PDFPage,
  text: string,
  x: number,
  width: number,
  y: number,
  font: PdfFonts["fontBold"],
  fontSize: number,
  align: MonthlyHeaderAlign,
) {
  if (!text) {
    return;
  }

  const safeText = toPdfSafeText(text);
  const textWidth = font.widthOfTextAtSize(safeText, fontSize);
  const offsetX = align === "center" ? Math.max(0, (width - textWidth) / 2) : 0;

  page.drawText(safeText, {
    x: x + offsetX,
    y,
    size: fontSize,
    font,
    color: BRAND_GOLD,
  });
}

function drawMonthlyTableHeaders(
  page: PDFPage,
  y: number,
  colX: number[],
  colWidths: number[],
  fonts: PdfFonts,
  headerFontSize: number,
  rowGap: number,
  headerTopGap: number,
  headerBottomGap: number,
) {
  const { fontBold } = fonts;
  const headerTopY = y - headerTopGap;

  for (const group of MONTHLY_HEADER_ROW1) {
    const groupWidth = colWidths
      .slice(group.startCol, group.startCol + group.span)
      .reduce((sum, width) => sum + width, 0);
    drawAlignedHeaderText(
      page,
      group.label,
      colX[group.startCol],
      groupWidth,
      headerTopY,
      fontBold,
      headerFontSize,
      monthlyHeaderRow1Align(group.label, group.span),
    );
  }

  const subHeaderY = headerTopY - rowGap;
  MONTHLY_HEADER_ROW2.forEach((header, index) => {
    drawAlignedHeaderText(
      page,
      header,
      colX[index],
      colWidths[index],
      subHeaderY,
      fontBold,
      headerFontSize,
      monthlyColumnAlign(index),
    );
  });

  return subHeaderY - headerBottomGap;
}

function drawMonthlyTableRow(
  page: PDFPage,
  y: number,
  values: string[],
  colX: number[],
  colWidths: number[],
  font: PdfFonts["font"],
  fontSize: number,
) {
  values.forEach((value, index) => {
    const safeText = pdfText(value);
    const textWidth = font.widthOfTextAtSize(safeText, fontSize);
    const align = monthlyColumnAlign(index);
    const offsetX =
      align === "center" ? Math.max(0, (colWidths[index] - textWidth) / 2) : 0;

    page.drawText(safeText, {
      x: colX[index] + offsetX,
      y,
      size: fontSize,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
  });
}

function addLandscapePage(pdfDoc: PDFDocument) {
  const page = pdfDoc.addPage([
    MONTHLY_PDF_PAGE.width,
    MONTHLY_PDF_PAGE.height,
  ]);
  drawGoldBorder(page, MONTHLY_PDF_PAGE.width, MONTHLY_PDF_PAGE.height);
  return page;
}

export async function ramadanTimetableToPdfBuffer(input: {
  year: number;
  hijriYear?: number | null;
  startDate: string;
  endDate: string;
  rows: RamadanDayRow[];
  settings: RamadanSettingsData;
  paymentQrs?: RamadanPaymentQRItem[];
}) {
  return renderRamadanTimetablePdf(input);
}

export async function monthlyTimetableToPdfBuffer(input: {
  month: number;
  year: number;
  rows: MonthlyDayRow[];
}) {
  const branding = await getDonationStatementBranding();
  const logoPng = await loadStatementLogoPng(branding.logoPath);
  const donationQrPng = await generateQrPngBytes(
    `${branding.website}/donations`,
    280,
  );
  const pdfDoc = await PDFDocument.create();
  const fonts = await embedStandardFonts(pdfDoc);
  const { font } = fonts;
  const monthLabel = format(
    new Date(input.year, input.month - 1, 1),
    "MMMM yyyy",
  );
  const title = `${monthLabel} Prayer Timetable`;
  const baseFontSize = 7 * MONTHLY_FONT_SCALE;
  const rowCount = Math.max(input.rows.length, 1);
  const { positions: colX, widths: colWidths } = buildColumnLayout(
    MONTHLY_PDF_PAGE.width,
    PDF_MARGIN,
    MONTHLY_COLUMN_WEIGHTS,
  );

  const page = addLandscapePage(pdfDoc);
  let y = MONTHLY_PDF_PAGE.height - PDF_MARGIN;
  y = await drawLetterhead(
    pdfDoc,
    page,
    y - PDF_SECTION_GAP,
    branding,
    fonts,
    logoPng,
    buildTimetableLetterheadOptions({
      pageWidth: MONTHLY_PDF_PAGE.width,
      donationQrPng,
      donationQrLabel: "Donate now",
    }),
  );

  y = drawPdfTitleSection(page, title, y, fonts, {
    pageWidth: MONTHLY_PDF_PAGE.width,
    margin: PDF_MARGIN,
    titleSize: PDF_TITLE_FONT_SIZE,
    sectionGap: PDF_SECTION_GAP,
    align: "left",
  });

  const tableTopY = y;
  const { fontSize, headerFontSize, rowHeight, rowGap } =
    computeMonthlyTableMetrics(
      tableTopY,
      rowCount,
      baseFontSize,
      MONTHLY_PAGE_BOTTOM_RESERVE,
      0,
      PDF_SECTION_GAP,
    );

  y = drawMonthlyTableHeaders(
    page,
    y,
    colX,
    colWidths,
    fonts,
    headerFontSize,
    rowGap,
    0,
    PDF_SECTION_GAP,
  );

  for (const row of input.rows) {
    drawMonthlyTableRow(
      page,
      y,
      [
        format(parseDateKey(row.date), "d MMM"),
        format(parseDateKey(row.date), "EEEE"),
        row.fajrAdhan,
        row.fajrIqama,
        row.sunrise,
        row.dhuhrAdhan,
        row.dhuhrIqama,
        row.asrAdhan,
        row.asrIqama,
        row.maghribAdhan,
        row.maghribIqama,
        row.ishaAdhan,
        row.ishaIqama,
      ],
      colX,
      colWidths,
      font,
      fontSize,
    );
    y -= rowHeight;
  }

  return pdfDoc.save();
}

export function timetablePdfFilename(
  kind: "ramadan" | "monthly",
  year: number,
  month?: number,
) {
  if (kind === "ramadan") {
    return `ramadan-timetable-${year}.pdf`;
  }
  return `prayer-timetable-${year}-${String(month).padStart(2, "0")}.pdf`;
}
