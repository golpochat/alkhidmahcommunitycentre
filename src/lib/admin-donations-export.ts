import { PDFDocument, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import * as XLSX from "xlsx";
import type { Donation } from "@prisma/client";
import {
  centsToEuros,
  formatProviderLabel,
  resolveDonationAccounting,
  sumDonationAccounting,
  getStatementCharitableTotalCents,
  type DonationProviderFeeConfigs,
} from "@/lib/donation-accounting";
import { getCategoryLabel, type DonationStatus } from "@/lib/donations";
import {
  formatDonationCents,
  formatDonationMoney,
  normalizeDonationCurrency,
} from "@/lib/donation-processing-fee";
import { embedDonationPdfFonts } from "@/lib/donation-pdf-fonts";
import type { DonationStatementBranding } from "@/lib/donation-statement-branding";
import {
  buildStatementFooterPrimaryLine,
  buildStatementFooterPageLine,
  formatExportTransactionId,
  formatStatementPeriodDate,
  formatStatementPrintedAt,
  formatStatementStatus,
  formatStatementTableDate,
} from "@/lib/donation-statement-format";
import {
  BRAND_GREEN,
  BRAND_GOLD,
  MUTED,
  PDF_MARGIN,
  STATEMENT_FOOTER_HEIGHT,
  STATEMENT_LETTERHEAD_RULE_GAP,
  STATEMENT_TABLE_HEADER_HEIGHT,
  STATEMENT_TABLE_ROW_HEIGHT,
  STATEMENT_TITLE_RULE_CLEARANCE,
  STATEMENT_TITLE_SIZE,
  buildDonationStatementLetterheadOptions,
  drawDonationStatementFooters,
  drawHorizontalRule,
  drawLetterhead,
  getPdfFontVerticalMetrics,
  toPdfSafeText,
  wrapText,
} from "@/lib/donation-pdf-layout";

export type DonationExportFormat = "csv" | "xlsx" | "pdf";

const PDF_LANDSCAPE = { width: 841.89, height: 595.28 };
const CONTENT_BOTTOM_LANDSCAPE = PDF_MARGIN + STATEMENT_FOOTER_HEIGHT;
const TABLE_HEADER_FONT_SIZE = 8;
const TABLE_HEADER_RULE_GAP = 6;
const SUMMARY_TO_TABLE_GAP = 14;
const STATUS_SUMMARY_LINE_HEIGHT = 11;

const PDF_STATUS_SECTIONS: DonationStatus[] = ["succeeded", "pending", "failed"];

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
  statusKey: DonationStatus;
  transactionId: string;
  date: string;
}

type PdfColumn = {
  label: string;
  widthRatio: number;
  align: "left" | "right";
};

/** Full-width PDF table columns — Date, Donor, Category, Charged, Fee, Received, Provider, Status */
const PDF_COLUMNS: PdfColumn[] = [
  { label: "Date", widthRatio: 0.16, align: "left" },
  { label: "Donor", widthRatio: 0.18, align: "left" },
  { label: "Category", widthRatio: 0.16, align: "left" },
  { label: "Charged", widthRatio: 0.1, align: "right" },
  { label: "Fee", widthRatio: 0.08, align: "right" },
  { label: "Received", widthRatio: 0.1, align: "right" },
  { label: "Provider", widthRatio: 0.1, align: "right" },
  { label: "Status", widthRatio: 0.12, align: "right" },
];

export type DonationCategoryLookup = { slug: string; name: string };

export function mapDonationsToExportRows(
  donations: Donation[],
  feeConfigs: DonationProviderFeeConfigs = {},
  categories: DonationCategoryLookup[] = [],
): DonationExportRow[] {
  return donations.map((donation) => {
    const accounting = resolveDonationAccounting(donation, feeConfigs);
    const currency = normalizeDonationCurrency(donation.currency);

    return {
      donorName: donation.donorName || "Anonymous",
      donorEmail: donation.donorEmail || "",
      totalCharged: centsToEuros(accounting.totalChargedCents),
      processingFee: centsToEuros(accounting.processingFeeCents),
      netReceived: centsToEuros(accounting.netReceivedCents),
      feeCoveredByDonor: accounting.coverFee,
      currency,
      category: getCategoryLabel(donation.category, categories),
      provider: formatProviderLabel(donation.provider),
      status: formatStatementStatus(donation.status),
      statusKey: donation.status as DonationStatus,
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
  return formatDonationMoney(amountEuros, currency);
}

function resolvePdfColumnWidths(tableWidth: number) {
  const columns = PDF_COLUMNS.map((column) => ({
    ...column,
    width: Math.floor(tableWidth * column.widthRatio),
  }));
  const usedWidth = columns.reduce((sum, column) => sum + column.width, 0);
  columns[columns.length - 1].width += tableWidth - usedWidth;
  return columns;
}

function drawStatusSummaryColumn(
  page: PDFPage,
  x: number,
  width: number,
  topY: number,
  status: DonationStatus,
  totals: ReturnType<typeof sumDonationAccounting>,
  currency: string,
  font: PDFFont,
  fontBold: PDFFont,
) {
  let colY = topY;

  page.drawText(formatStatementStatus(status), {
    x: x + 4,
    y: colY,
    size: 10,
    font: fontBold,
    color: BRAND_GREEN,
  });
  colY -= 14;

  const lines: Array<[string, string]> = [
    [
      "Total charitable amount:",
      formatDonationCents(getStatementCharitableTotalCents(totals), currency),
    ],
    ["Total fees:", formatDonationCents(totals.processingFeeTotalCents, currency)],
    ["Total Received:", formatDonationCents(totals.netReceivedCents, currency)],
  ];

  for (const [label, value] of lines) {
    page.drawText(label, {
      x: x + 4,
      y: colY,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    const valueText = value;
    const valueWidth = font.widthOfTextAtSize(valueText, 8);
    page.drawText(valueText, {
      x: x + width - 4 - valueWidth,
      y: colY,
      size: 8,
      font,
      color: rgb(0, 0, 0),
    });
    colY -= STATUS_SUMMARY_LINE_HEIGHT;
  }

  return colY;
}

function drawHorizontalStatusSummaries(
  page: PDFPage,
  topY: number,
  tableWidth: number,
  margin: number,
  summaries: Array<{
    status: DonationStatus;
    totals: ReturnType<typeof sumDonationAccounting>;
  }>,
  currency: string,
  font: PDFFont,
  fontBold: PDFFont,
) {
  const columnWidth = tableWidth / summaries.length;
  let lowestY = topY;

  summaries.forEach((summary, index) => {
    const columnX = margin + index * columnWidth;
    const columnBottom = drawStatusSummaryColumn(
      page,
      columnX,
      columnWidth,
      topY,
      summary.status,
      summary.totals,
      currency,
      font,
      fontBold,
    );
    lowestY = Math.min(lowestY, columnBottom);
  });

  summaries.forEach((_, index) => {
    if (index === 0) {
      return;
    }

    const columnX = margin + index * columnWidth;
    page.drawLine({
      start: { x: columnX, y: topY + 4 },
      end: { x: columnX, y: lowestY + 4 },
      thickness: 0.5,
      color: BRAND_GOLD,
    });
  });

  return lowestY - SUMMARY_TO_TABLE_GAP;
}

function drawTableCell(
  page: PDFPage,
  text: string,
  column: PdfColumn & { width: number },
  columnX: number,
  y: number,
  font: PDFFont,
  color = rgb(0, 0, 0),
) {
  const fontSize = 8;
  const padding = 4;
  let x = columnX + padding;

  if (column.align === "right") {
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    x = columnX + column.width - padding - textWidth;
  }

  page.drawText(text, {
    x,
    y,
    size: fontSize,
    font,
    color,
  });
}

function drawStatementFooters(
  pdfDoc: PDFDocument,
  branding: DonationStatementBranding,
  printedAt: string,
  fonts: Awaited<ReturnType<typeof embedDonationPdfFonts>>,
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
      buildStatementFooterPageLine(pageNumber, totalPages),
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
  const fonts = await embedDonationPdfFonts(pdfDoc);
  const { font, fontBold } = fonts;
  const pageWidth = PDF_LANDSCAPE.width;
  const pageHeight = PDF_LANDSCAPE.height;
  const tableWidth = pageWidth - PDF_MARGIN * 2;
  const pdfColumns = resolvePdfColumnWidths(tableWidth);
  const donations = options.donations ?? [];
  const feeConfigs = options.feeConfigs ?? {};

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - PDF_MARGIN;

  y = await drawLetterhead(
    pdfDoc,
    page,
    y,
    branding,
    fonts,
    options.logoPng,
    buildDonationStatementLetterheadOptions({ pageWidth, pageHeight }),
  );

  const titleMetrics = getPdfFontVerticalMetrics(fontBold, STATEMENT_TITLE_SIZE);
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
    color: BRAND_GREEN,
  });
  y -= titleMetrics.descent + 10;

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
    color: MUTED,
  });
  y -= 18;

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

  const currency = normalizeDonationCurrency(rows[0]?.currency);

  function ensureSpace(requiredHeight: number, repeatTableHeader = false) {
    if (y >= CONTENT_BOTTOM_LANDSCAPE + requiredHeight) {
      return;
    }

    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - PDF_MARGIN;

    if (repeatTableHeader) {
      drawTableHeaderRow();
    }
  }

  function drawTableHeaderRow() {
    const headerMetrics = getPdfFontVerticalMetrics(fontBold, TABLE_HEADER_FONT_SIZE);
    const rowMetrics = getPdfFontVerticalMetrics(font, TABLE_HEADER_FONT_SIZE);
    let columnX = PDF_MARGIN;

    for (const column of pdfColumns) {
      drawTableCell(
        page,
        column.label,
        column,
        columnX,
        y,
        fontBold,
        BRAND_GREEN,
      );
      columnX += column.width;
    }

    const ruleY = y - headerMetrics.descent - TABLE_HEADER_RULE_GAP;
    drawHorizontalRule(page, ruleY, pageWidth);
    y = ruleY - TABLE_HEADER_RULE_GAP - rowMetrics.ascent;
  }

  function drawDataRow(row: DonationExportRow) {
    const donorLines = wrapText(
      row.donorName,
      font,
      8,
      pdfColumns[1].width - 8,
    );
    const categoryLines = wrapText(
      row.category,
      font,
      8,
      pdfColumns[2].width - 8,
    );
    const cells = [
      row.date,
      donorLines[0] ?? "",
      categoryLines[0] ?? "",
      formatMoneyForPdf(row.totalCharged, row.currency),
      formatMoneyForPdf(row.processingFee, row.currency),
      formatMoneyForPdf(row.netReceived, row.currency),
      row.provider,
      row.status,
    ];

    let columnX = PDF_MARGIN;
    for (let i = 0; i < pdfColumns.length; i += 1) {
      drawTableCell(page, cells[i], pdfColumns[i], columnX, y, font);
      columnX += pdfColumns[i].width;
    }

    y -= STATEMENT_TABLE_ROW_HEIGHT;
  }

  const statusSummaries = PDF_STATUS_SECTIONS.flatMap((status) => {
    const statusDonations = donations.filter((donation) => donation.status === status);
    if (statusDonations.length === 0) {
      return [];
    }

    return [
      {
        status,
        totals: sumDonationAccounting(statusDonations, feeConfigs),
      },
    ];
  });

  const sortedRows = donations
    .map((donation, index) => ({ donation, row: rows[index] }))
    .sort(
      (a, b) => b.donation.createdAt.getTime() - a.donation.createdAt.getTime(),
    )
    .map((entry) => entry.row);

  const summaryBlockHeight = 14 + STATUS_SUMMARY_LINE_HEIGHT * 3 + SUMMARY_TO_TABLE_GAP;
  const tableStartHeight =
    summaryBlockHeight + STATEMENT_TABLE_HEADER_HEIGHT + STATEMENT_TABLE_ROW_HEIGHT;

  ensureSpace(tableStartHeight);

  y = drawHorizontalStatusSummaries(
    page,
    y,
    tableWidth,
    PDF_MARGIN,
    statusSummaries,
    currency,
    font,
    fontBold,
  );

  drawTableHeaderRow();

  for (const row of sortedRows) {
    ensureSpace(STATEMENT_TABLE_ROW_HEIGHT, true);
    drawDataRow(row);
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
