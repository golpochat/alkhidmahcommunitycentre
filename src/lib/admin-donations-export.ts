import { format } from "date-fns";
import { PDFDocument, StandardFonts, rgb, type PDFPage } from "pdf-lib";
import * as XLSX from "xlsx";
import type { Donation } from "@prisma/client";
import { getCategoryLabel } from "@/lib/donations";
import type { DonationStatementBranding } from "@/lib/donation-statement-branding";

export type DonationExportFormat = "csv" | "xlsx" | "pdf";

export interface DonationExportRow {
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  category: string;
  provider: string;
  status: string;
  transactionId: string;
  date: string;
}

const PDF_PAGE = { width: 595.28, height: 841.89 };
const PDF_MARGIN = 48;
const PDF_FOOTER_HEIGHT = 58;
const CONTENT_BOTTOM = PDF_MARGIN + PDF_FOOTER_HEIGHT;
const BRAND_GREEN = rgb(15 / 255, 107 / 255, 74 / 255);
const BRAND_GOLD = rgb(212 / 255, 175 / 255, 55 / 255);
const MUTED = rgb(0.35, 0.35, 0.35);
const TABLE_HEADER_FILL = rgb(0.94, 0.94, 0.94);

const PDF_COLUMNS = [
  { label: "Donor", width: 95 },
  { label: "Amount", width: 52 },
  { label: "Category", width: 78 },
  { label: "Provider", width: 58 },
  { label: "Status", width: 58 },
  { label: "Date", width: 98 },
] as const;

export function mapDonationsToExportRows(
  donations: Donation[]
): DonationExportRow[] {
  return donations.map((donation) => ({
    donorName: donation.donorName || "Anonymous",
    donorEmail: donation.donorEmail || "",
    amount: donation.amount,
    currency: donation.currency,
    category: getCategoryLabel(donation.category),
    provider: donation.provider,
    status: donation.status,
    transactionId: donation.providerId || "",
    date: format(donation.createdAt, "yyyy-MM-dd HH:mm"),
  }));
}

export function exportFilename(
  formatType: DonationExportFormat,
  from?: string | null,
  to?: string | null
) {
  const range =
    from && to ? `${from}-to-${to}` : format(new Date(), "yyyy-MM-dd");
  return `donations-statement-${range}.${formatType === "xlsx" ? "xlsx" : formatType}`;
}

export function donationsToCsv(rows: DonationExportRow[]) {
  const header =
    "Donor Name,Donor Email,Amount,Currency,Category,Provider,Status,Transaction ID,Date";
  const body = rows.map(
    (row) =>
      `"${row.donorName.replace(/"/g, '""')}","${row.donorEmail.replace(/"/g, '""')}",${row.amount},${row.currency},"${row.category}",${row.provider},${row.status},"${row.transactionId.replace(/"/g, '""')}",${row.date}`
  );
  return [header, ...body].join("\n");
}

export function donationsToXlsxBuffer(rows: DonationExportRow[]) {
  const worksheet = XLSX.utils.json_to_sheet(
    rows.map((row) => ({
      "Donor Name": row.donorName,
      "Donor Email": row.donorEmail,
      Amount: row.amount,
      Currency: row.currency,
      Category: row.category,
      Provider: row.provider,
      Status: row.status,
      "Transaction ID": row.transactionId,
      Date: row.date,
    }))
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Donations");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}…`;
}

function drawHorizontalRule(page: PDFPage, y: number) {
  page.drawLine({
    start: { x: PDF_MARGIN, y },
    end: { x: PDF_PAGE.width - PDF_MARGIN, y },
    thickness: 0.75,
    color: BRAND_GOLD,
  });
}

function drawPageFooters(
  pdfDoc: PDFDocument,
  branding: DonationStatementBranding,
  printedAt: string,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  fontBold: Awaited<ReturnType<PDFDocument["embedFont"]>>
) {
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  pages.forEach((footerPage, index) => {
    const footerTop = PDF_MARGIN + 38;
    drawHorizontalRule(footerPage, footerTop);

    footerPage.drawText(
      `Registered charity number: ${branding.charityNumber}`,
      {
        x: PDF_MARGIN,
        y: footerTop - 16,
        size: 8,
        font: fontBold,
        color: BRAND_GREEN,
      }
    );

    footerPage.drawText(
      `${branding.siteName} · ${branding.address}`,
      {
        x: PDF_MARGIN,
        y: footerTop - 28,
        size: 7.5,
        font,
        color: MUTED,
        maxWidth: PDF_PAGE.width - PDF_MARGIN * 2,
      }
    );

    footerPage.drawText(
      `Tel: ${branding.phone} · Email: ${branding.email} · ${branding.website}`,
      {
        x: PDF_MARGIN,
        y: footerTop - 40,
        size: 7.5,
        font,
        color: MUTED,
        maxWidth: PDF_PAGE.width - PDF_MARGIN * 2,
      }
    );

    const pageLabel = `Page ${index + 1} of ${totalPages}`;
    const pageLabelWidth = font.widthOfTextAtSize(pageLabel, 8);
    footerPage.drawText(pageLabel, {
      x: PDF_PAGE.width - PDF_MARGIN - pageLabelWidth,
      y: footerTop - 16,
      size: 8,
      font,
      color: MUTED,
    });

    const printedLabel = `Printed: ${printedAt}`;
    const printedWidth = font.widthOfTextAtSize(printedLabel, 8);
    footerPage.drawText(printedLabel, {
      x: PDF_PAGE.width - PDF_MARGIN - printedWidth,
      y: footerTop - 28,
      size: 8,
      font,
      color: MUTED,
    });
  });
}

export async function donationsToPdfBuffer(
  rows: DonationExportRow[],
  options: {
    from?: string | null;
    to?: string | null;
    branding: DonationStatementBranding;
    logoPng?: Uint8Array | null;
  }
) {
  const { branding } = options;
  const printedAt = format(new Date(), "d MMM yyyy 'at' HH:mm");
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PDF_PAGE.width, PDF_PAGE.height]);
  let y = PDF_PAGE.height - PDF_MARGIN;

  const contactStartX = options.logoPng ? 168 : PDF_MARGIN;

  if (options.logoPng) {
    const logoImage = await pdfDoc.embedPng(options.logoPng);
    const logoDims = logoImage.scale(0.35);
    const logoHeight = Math.min(logoDims.height, 46);
    const logoWidth = (logoDims.width / logoDims.height) * logoHeight;

    page.drawImage(logoImage, {
      x: PDF_MARGIN,
      y: y - logoHeight + 8,
      width: logoWidth,
      height: logoHeight,
    });
  }

  page.drawText(branding.siteName, {
    x: contactStartX,
    y,
    size: 14,
    font: fontBold,
    color: BRAND_GREEN,
  });
  y -= 18;

  const contactLines = [
    branding.address,
    `Tel: ${branding.phone}`,
    `Email: ${branding.email}`,
    branding.website,
  ];

  for (const line of contactLines) {
    page.drawText(line, {
      x: contactStartX,
      y,
      size: 9,
      font,
      color: MUTED,
      maxWidth: PDF_PAGE.width - contactStartX - PDF_MARGIN,
    });
    y -= 12;
  }

  y -= 6;
  drawHorizontalRule(page, y);
  y -= 22;

  page.drawText("Donations Statement", {
    x: PDF_MARGIN,
    y,
    size: 16,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= 20;

  const periodLabel =
    options.from && options.to
      ? `Reporting period: ${format(new Date(`${options.from}T12:00:00`), "d MMM yyyy")} – ${format(new Date(`${options.to}T12:00:00`), "d MMM yyyy")}`
      : "Reporting period: All dates";
  page.drawText(periodLabel, {
    x: PDF_MARGIN,
    y,
    size: 10,
    font,
    color: rgb(0, 0, 0),
  });
  y -= 14;

  page.drawText(`Date printed: ${printedAt}`, {
    x: PDF_MARGIN,
    y,
    size: 10,
    font,
    color: MUTED,
  });
  y -= 20;

  function ensureSpace(minY: number) {
    if (y < minY) {
      page = pdfDoc.addPage([PDF_PAGE.width, PDF_PAGE.height]);
      y = PDF_PAGE.height - PDF_MARGIN;
    }
  }

  if (rows.length === 0) {
    page.drawText("No donations found for the selected filters.", {
      x: PDF_MARGIN,
      y,
      size: 11,
      font,
      color: rgb(0, 0, 0),
    });
    drawPageFooters(pdfDoc, branding, printedAt, font, fontBold);
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  const succeededTotal = rows
    .filter((row) => row.status === "succeeded")
    .reduce((sum, row) => sum + row.amount, 0);

  page.drawRectangle({
    x: PDF_MARGIN,
    y: y - 36,
    width: PDF_PAGE.width - PDF_MARGIN * 2,
    height: 40,
    color: rgb(0.97, 0.98, 0.97),
    borderColor: BRAND_GOLD,
    borderWidth: 0.5,
  });

  page.drawText(`Total records: ${rows.length}`, {
    x: PDF_MARGIN + 12,
    y: y - 14,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  page.drawText(`Total amount: €${total.toFixed(2)}`, {
    x: PDF_MARGIN + 12,
    y: y - 28,
    size: 10,
    font: fontBold,
    color: BRAND_GREEN,
  });

  const succeededLabel = `Succeeded payments: €${succeededTotal.toFixed(2)}`;
  const succeededWidth = font.widthOfTextAtSize(succeededLabel, 9);
  page.drawText(succeededLabel, {
    x: PDF_PAGE.width - PDF_MARGIN - 12 - succeededWidth,
    y: y - 22,
    size: 9,
    font,
    color: MUTED,
  });

  y -= 52;
  ensureSpace(CONTENT_BOTTOM + 40);

  const tableWidth = PDF_PAGE.width - PDF_MARGIN * 2;
  page.drawRectangle({
    x: PDF_MARGIN,
    y: y - 2,
    width: tableWidth,
    height: 16,
    color: TABLE_HEADER_FILL,
  });

  let x = PDF_MARGIN + 4;
  for (const column of PDF_COLUMNS) {
    page.drawText(column.label, {
      x,
      y: y + 1,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    x += column.width;
  }

  y -= 18;

  for (const row of rows) {
    ensureSpace(CONTENT_BOTTOM + 16);

    x = PDF_MARGIN + 4;
    const cells = [
      truncateText(row.donorName, 18),
      `€${row.amount}`,
      truncateText(row.category, 16),
      truncateText(row.provider, 12),
      truncateText(row.status, 12),
      row.date,
    ];

    for (let i = 0; i < PDF_COLUMNS.length; i += 1) {
      page.drawText(cells[i], {
        x,
        y,
        size: 9,
        font,
        color: rgb(0, 0, 0),
      });
      x += PDF_COLUMNS[i].width;
    }

    y -= 14;
  }

  drawPageFooters(pdfDoc, branding, printedAt, font, fontBold);

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
