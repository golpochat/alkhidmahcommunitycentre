import { PDFDocument, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import * as XLSX from "xlsx";
import type { Donation } from "@prisma/client";
import {
  centsToEuros,
  formatProviderLabel,
  resolveDonationAccounting,
  sumDonationAccounting,
  type DonationProviderFeeConfigs,
} from "@/lib/donation-accounting";
import { getCategoryLabel } from "@/lib/donations";
import { formatDonationMoney, formatDonationCents } from "@/lib/donation-processing-fee";
import type { DonationStatementBranding } from "@/lib/donation-statement-branding";
import {
  buildStatementFooterPrimaryLine,
  buildStatementFooterSecondaryLine,
  formatExportTransactionId,
  formatStatementPeriodDate,
  formatStatementPrintedAt,
  formatStatementStatus,
  formatStatementTableDate,
} from "@/lib/donation-statement-format";
import {
  BRAND_GREEN,
  BRAND_GOLD,
  drawDonationStatementFooters,
  drawLetterhead,
  embedStandardFonts,
  getPdfFontVerticalMetrics,
  PDF_MARGIN,
  toPdfSafeText,
  wrapText,
} from "@/lib/donation-pdf-layout";

export type DonationExportFormat = "csv" | "xlsx" | "pdf";

const PDF_LANDSCAPE = { width: 841.89, height: 595.28 };
const PDF_FOOTER_HEIGHT = 62;
const CONTENT_BOTTOM_LANDSCAPE = PDF_MARGIN + PDF_FOOTER_HEIGHT;
const TABLE_HEADER_HEIGHT = 18;
const TABLE_ROW_HEIGHT = 16;
const MUTED = rgb(0.35, 0.35, 0.35);
const TABLE_HEADER_FILL = rgb(0.94, 0.94, 0.94);
const STATEMENT_TITLE_SIZE = 17;
const STATEMENT_LETTERHEAD_SCALE = 0.88;
/** Matches ruleGap passed to drawLetterhead for this PDF. */
const STATEMENT_LETTERHEAD_RULE_GAP = 10;
/** Clear space between the letterhead gold rule and the title ascenders. */
const STATEMENT_TITLE_RULE_CLEARANCE = 12;

export interface DonationExportRow {
  donorName: string;
  donorEmail: string;
  totalCharged: number;
  processingFee: number;
  netReceived: number;
  feeCoveredByDonor: boolean;
  currency: string;
  category: string;
  provider: string;
  status: string;
  transactionId: string;
  date: string;
}

type PdfColumn = {
  label: string;
  width: number;
  align: "left" | "right";
};

const PDF_COLUMNS: PdfColumn[] = [
  { label: "Donor", width: 96, align: "left" },
  { label: "Charged", width: 58, align: "right" },
  { label: "Fee", width: 50, align: "right" },
  { label: "Net", width: 54, align: "right" },
  { label: "Category", width: 76, align: "left" },
  { label: "Provider", width: 54, align: "left" },
  { label: "Status", width: 54, align: "left" },
  { label: "Date", width: 98, align: "left" },
  { label: "Transaction ID", width: 118, align: "left" },
];

export type DonationCategoryLookup = { slug: string; name: string };

export function mapDonationsToExportRows(
  donations: Donation[],
  feeConfigs: DonationProviderFeeConfigs = {},
  categories: DonationCategoryLookup[] = [],
): DonationExportRow[] {
  return donations.map((donation) => {
    const accounting = resolveDonationAccounting(donation, feeConfigs);
    const currency = donation.currency || "EUR";
    const totalChargedCents = accounting.totalChargedCents;
    const processingFeeCents = accounting.processingFeeCents;
    const netReceivedCents = Math.max(0, totalChargedCents - processingFeeCents);

    return {
      donorName: donation.donorName || "Anonymous",
      donorEmail: donation.donorEmail || "",
      totalCharged: centsToEuros(totalChargedCents),
      processingFee: centsToEuros(processingFeeCents),
      netReceived: centsToEuros(netReceivedCents),
      feeCoveredByDonor: accounting.coverFee,
      currency,
      category: getCategoryLabel(donation.category, categories),
      provider: formatProviderLabel(donation.provider),
      status: formatStatementStatus(donation.status),
      transactionId: formatExportTransactionId(
        donation.provider,
        donation.providerId,
      ),
      date: formatStatementTableDate(donation.createdAt),
    };
  });
}

export function exportFilename(
  formatType: DonationExportFormat,
  from?: string | null,
  to?: string | null,
) {
  const range =
    from && to ? `${from}-to-${to}` : new Date().toISOString().slice(0, 10);
  return `donations-statement-${range}.${formatType === "xlsx" ? "xlsx" : formatType}`;
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function donationsToCsv(rows: DonationExportRow[]) {
  const header =
    "Donor Name,Donor Email,Charged,Processing Fee,Net Received,Fee Covered By Donor,Currency,Category,Provider,Status,Transaction ID,Date";
  const body = rows.map((row) =>
    [
      escapeCsv(row.donorName),
      escapeCsv(row.donorEmail),
      row.totalCharged.toFixed(2),
      row.processingFee.toFixed(2),
      row.netReceived.toFixed(2),
      row.feeCoveredByDonor ? "Yes" : "No",
      row.currency,
      escapeCsv(row.category),
      row.provider,
      row.status,
      escapeCsv(row.transactionId),
      row.date,
    ].join(","),
  );
  return [header, ...body].join("\n");
}

export function donationsToXlsxBuffer(rows: DonationExportRow[]) {
  const worksheet = XLSX.utils.json_to_sheet(
    rows.map((row) => ({
      "Donor Name": row.donorName,
      "Donor Email": row.donorEmail,
      Charged: row.totalCharged,
      "Processing Fee": row.processingFee,
      "Net Received": row.netReceived,
      "Fee Covered By Donor": row.feeCoveredByDonor ? "Yes" : "No",
      Currency: row.currency,
      Category: row.category,
      Provider: row.provider,
      Status: row.status,
      "Transaction ID": row.transactionId,
      Date: row.date,
    })),
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Donations");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

function formatMoneyForPdf(amountEuros: number, currency: string) {
  return toPdfSafeText(formatDonationMoney(amountEuros, currency));
}

function drawSummaryLine(
  page: PDFPage,
  label: string,
  value: string,
  y: number,
  font: PDFFont,
  fontBold: PDFFont,
  x: number,
  valueColor = rgb(0, 0, 0),
) {
  page.drawText(label, {
    x,
    y,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  page.drawText(value, {
    x: x + 156,
    y,
    size: 9,
    font,
    color: valueColor,
  });
}

function drawTableCell(
  page: PDFPage,
  text: string,
  column: PdfColumn,
  columnX: number,
  y: number,
  font: PDFFont,
) {
  const fontSize = 8;
  const safeText = toPdfSafeText(text);
  const padding = 4;
  let x = columnX + padding;

  if (column.align === "right") {
    const textWidth = font.widthOfTextAtSize(safeText, fontSize);
    x = columnX + column.width - padding - textWidth;
  }

  page.drawText(safeText, {
    x,
    y,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });
}

function drawStatementFooters(
  pdfDoc: PDFDocument,
  branding: DonationStatementBranding,
  printedAt: string,
  fonts: Awaited<ReturnType<typeof embedStandardFonts>>,
) {
  drawDonationStatementFooters(
    pdfDoc,
    branding,
    printedAt,
    fonts,
    (statementBranding) =>
      buildStatementFooterPrimaryLine({
        charityNumber: statementBranding.charityNumber,
        siteName: statementBranding.siteName,
        address: statementBranding.address,
        phone: statementBranding.phone,
        email: statementBranding.email,
        website: statementBranding.website,
      }),
    (pageNumber, totalPages) =>
      buildStatementFooterSecondaryLine(pageNumber, totalPages, printedAt),
  );
}

export async function donationsToPdfBuffer(
  rows: DonationExportRow[],
  options: {
    from?: string | null;
    to?: string | null;
    branding: DonationStatementBranding;
    logoPng?: Uint8Array | null;
    donations?: Donation[];
    feeConfigs?: DonationProviderFeeConfigs;
  },
) {
  const { branding } = options;
  const printedAt = formatStatementPrintedAt();
  const pdfDoc = await PDFDocument.create();
  const fonts = await embedStandardFonts(pdfDoc);
  const { font, fontBold } = fonts;
  const pageWidth = PDF_LANDSCAPE.width;
  const pageHeight = PDF_LANDSCAPE.height;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - PDF_MARGIN;

  y = await drawLetterhead(
    pdfDoc,
    page,
    y,
    branding,
    fonts,
    options.logoPng,
    {
      pageWidth,
      combineEmailAndWebsite: true,
      fontScale: STATEMENT_LETTERHEAD_SCALE,
      compact: true,
      ruleGap: STATEMENT_LETTERHEAD_RULE_GAP,
    },
  );

  const titleMetrics = getPdfFontVerticalMetrics(fontBold, STATEMENT_TITLE_SIZE);
  // drawLetterhead returns one ruleGap below the rule; title glyphs extend above the baseline.
  y -=
    titleMetrics.ascent +
    STATEMENT_TITLE_RULE_CLEARANCE -
    STATEMENT_LETTERHEAD_RULE_GAP;

  const title = "Donations Statement";
  const titleWidth = fontBold.widthOfTextAtSize(title, STATEMENT_TITLE_SIZE);
  page.drawText(title, {
    x: (pageWidth - titleWidth) / 2,
    y,
    size: STATEMENT_TITLE_SIZE,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= titleMetrics.descent + 14;

  const periodLabel =
    options.from && options.to
      ? `Reporting period: ${formatStatementPeriodDate(options.from)} – ${formatStatementPeriodDate(options.to)}`
      : "Reporting period: All dates";
  const periodWidth = font.widthOfTextAtSize(toPdfSafeText(periodLabel), 10);
  page.drawText(toPdfSafeText(periodLabel), {
    x: (pageWidth - periodWidth) / 2,
    y,
    size: 10,
    font,
    color: rgb(0, 0, 0),
  });
  y -= 24;

  if (rows.length === 0) {
    page.drawText("No donations found for the selected filters.", {
      x: PDF_MARGIN,
      y,
      size: 11,
      font,
      color: rgb(0, 0, 0),
    });
    drawStatementFooters(pdfDoc, branding, printedAt, fonts);
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  const currency = rows[0]?.currency || "EUR";
  const totals =
    options.donations && options.donations.length > 0
      ? sumDonationAccounting(options.donations, options.feeConfigs ?? {})
      : {
          recordCount: rows.length,
          giftTotalCents: 0,
          processingFeeTotalCents: rows.reduce(
            (sum, row) => sum + Math.round(row.processingFee * 100),
            0,
          ),
          totalChargedCents: rows.reduce(
            (sum, row) => sum + Math.round(row.totalCharged * 100),
            0,
          ),
          netReceivedCents: rows.reduce(
            (sum, row) => sum + Math.round(row.netReceived * 100),
            0,
          ),
          feesCoveredByDonorsCents: rows.reduce(
            (sum, row) =>
              sum +
              (row.feeCoveredByDonor ? Math.round(row.processingFee * 100) : 0),
            0,
          ),
          feesDeductedFromGiftsCents: rows.reduce(
            (sum, row) =>
              sum +
              (!row.feeCoveredByDonor ? Math.round(row.processingFee * 100) : 0),
            0,
          ),
          succeededNetReceivedCents: rows
            .filter((row) => row.status.toLowerCase() === "succeeded")
            .reduce((sum, row) => sum + Math.round(row.netReceived * 100), 0),
        };

  if (!options.donations?.length) {
    totals.giftTotalCents = totals.totalChargedCents;
  }

  const giftsEqualCharged = totals.giftTotalCents === totals.totalChargedCents;
  const showSucceededNetSeparately =
    totals.succeededNetReceivedCents !== totals.netReceivedCents;
  const summaryLineCount =
    2 +
    1 +
    (giftsEqualCharged ? 1 : 2) +
    (showSucceededNetSeparately ? 1 : 0) +
    2;
  const summaryHeight = summaryLineCount * 12 + 16;

  page.drawRectangle({
    x: PDF_MARGIN,
    y: y - summaryHeight + 8,
    width: pageWidth - PDF_MARGIN * 2,
    height: summaryHeight,
    color: rgb(0.97, 0.98, 0.97),
    borderColor: BRAND_GOLD,
    borderWidth: 0.5,
  });

  const summaryLeftX = PDF_MARGIN + 12;
  const summaryRightX = pageWidth / 2 + 8;
  let summaryY = y - 6;

  page.drawText(`Total records: ${totals.recordCount}`, {
    x: summaryLeftX,
    y: summaryY,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  summaryY -= 14;

  drawSummaryLine(
    page,
    "Total charitable gifts (gross):",
    formatDonationCents(totals.giftTotalCents, currency),
    summaryY,
    font,
    fontBold,
    summaryLeftX,
    BRAND_GREEN,
  );
  summaryY -= 12;

  if (!giftsEqualCharged) {
    drawSummaryLine(
      page,
      "Total charged to donors:",
      formatDonationCents(totals.totalChargedCents, currency),
      summaryY,
      font,
      fontBold,
      summaryLeftX,
    );
    summaryY -= 12;
  }

  drawSummaryLine(
    page,
    "Total processing fees:",
    formatDonationCents(totals.processingFeeTotalCents, currency),
    summaryY,
    font,
    fontBold,
    summaryLeftX,
  );

  let summaryRightY = y - 20;
  drawSummaryLine(
    page,
    showSucceededNetSeparately ? "Net received (all):" : "Net received:",
    formatDonationCents(totals.netReceivedCents, currency),
    summaryRightY,
    font,
    fontBold,
    summaryRightX,
    BRAND_GREEN,
  );
  summaryRightY -= 12;

  if (showSucceededNetSeparately) {
    drawSummaryLine(
      page,
      "Net received (succeeded):",
      formatDonationCents(totals.succeededNetReceivedCents, currency),
      summaryRightY,
      font,
      fontBold,
      summaryRightX,
      BRAND_GREEN,
    );
    summaryRightY -= 12;
  }

  drawSummaryLine(
    page,
    "Fees covered by donors:",
    formatDonationCents(totals.feesCoveredByDonorsCents, currency),
    summaryRightY,
    font,
    fontBold,
    summaryRightX,
  );
  summaryRightY -= 12;

  drawSummaryLine(
    page,
    "Fees deducted from gifts:",
    formatDonationCents(totals.feesDeductedFromGiftsCents, currency),
    summaryRightY,
    font,
    fontBold,
    summaryRightX,
  );

  y -= summaryHeight + 12;

  function drawTableHeader() {
    const tableWidth = pageWidth - PDF_MARGIN * 2;
    page.drawRectangle({
      x: PDF_MARGIN,
      y: y - 2,
      width: tableWidth,
      height: 16,
      color: TABLE_HEADER_FILL,
    });

    let columnX = PDF_MARGIN;
    for (const column of PDF_COLUMNS) {
      drawTableCell(page, column.label, column, columnX, y + 1, fontBold);
      columnX += column.width;
    }

    y -= TABLE_HEADER_HEIGHT;
  }

  function startContinuationPage() {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - PDF_MARGIN;
    drawTableHeader();
  }

  function ensureTableRowSpace() {
    if (y >= CONTENT_BOTTOM_LANDSCAPE + TABLE_ROW_HEIGHT) {
      return;
    }

    startContinuationPage();
  }

  if (y < CONTENT_BOTTOM_LANDSCAPE + TABLE_HEADER_HEIGHT + TABLE_ROW_HEIGHT) {
    startContinuationPage();
  } else {
    drawTableHeader();
  }

  for (const row of rows) {
    ensureTableRowSpace();

    const donorLines = wrapText(
      toPdfSafeText(row.donorName),
      font,
      8,
      PDF_COLUMNS[0].width - 8,
    );
    const cells = [
      donorLines[0] ?? "",
      formatMoneyForPdf(row.totalCharged, row.currency),
      formatMoneyForPdf(row.processingFee, row.currency),
      formatMoneyForPdf(row.netReceived, row.currency),
      row.category,
      row.provider,
      row.status,
      row.date,
      row.transactionId || "—",
    ];

    let columnX = PDF_MARGIN;
    for (let i = 0; i < PDF_COLUMNS.length; i += 1) {
      drawTableCell(page, cells[i], PDF_COLUMNS[i], columnX, y, font);
      columnX += PDF_COLUMNS[i].width;
    }

    y -= TABLE_ROW_HEIGHT;
  }

  drawStatementFooters(pdfDoc, branding, printedAt, fonts);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export function exportContentType(formatType: DonationExportFormat) {
  switch (formatType) {
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "pdf":
      return "application/pdf";
    default:
      return "text/csv; charset=utf-8";
  }
}
