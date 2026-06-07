import { PDFDocument, rgb } from "pdf-lib";
import type { Donation } from "@prisma/client";
import {
  resolveDonationAccounting,
  formatProviderLabel,
  type DonationProviderFeeConfigs,
} from "@/lib/donation-accounting";
import { getCategoryLabel } from "@/lib/donations";
import type { DonationCategoryLookup } from "@/lib/admin-donations-export";
import { formatDonationCents } from "@/lib/donation-processing-fee";
import type { DonationStatementBranding } from "@/lib/donation-statement-branding";
import {
  buildStatementFooterPrimaryLine,
  buildStatementFooterSecondaryLine,
  formatExportTransactionId,
  formatStatementPrintedAt,
  formatStatementStatus,
  formatStatementTableDate,
} from "@/lib/donation-statement-format";
import {
  BRAND_GOLD,
  BRAND_GREEN,
  PDF_MARGIN,
  PDF_PAGE,
  drawDonationStatementFooters,
  drawLetterhead,
  embedStandardFonts,
  getPdfFontVerticalMetrics,
  toPdfSafeText,
} from "@/lib/donation-pdf-layout";

const RECEIPT_TITLE_SIZE = 17;
const RECEIPT_LETTERHEAD_SCALE = 0.88;
const RECEIPT_LETTERHEAD_RULE_GAP = 10;
const RECEIPT_TITLE_RULE_CLEARANCE = 16;

export interface DonationReceiptInput {
  id: string;
  donorName: string | null;
  donorEmail: string | null;
  amount: number;
  processingFeeCents: number;
  coverFee: boolean;
  currency: string;
  category: string;
  provider: string;
  providerId: string | null;
  status: string;
  createdAt: Date;
}

export function donationFromRecord(donation: Donation): DonationReceiptInput {
  return {
    id: donation.id,
    donorName: donation.donorName,
    donorEmail: donation.donorEmail,
    amount: donation.amount,
    processingFeeCents: donation.processingFeeCents,
    coverFee: donation.coverFee,
    currency: donation.currency,
    category: donation.category,
    provider: donation.provider,
    providerId: donation.providerId,
    status: donation.status,
    createdAt: donation.createdAt,
  };
}

export function receiptPdfFilename(donationId: string) {
  return `donation-receipt-${donationId.slice(0, 8)}.pdf`;
}

export async function donationReceiptToPdfBuffer(
  donation: DonationReceiptInput,
  branding: DonationStatementBranding,
  logoPng?: Uint8Array | null,
  options: {
    feeConfigs?: DonationProviderFeeConfigs;
    categories?: DonationCategoryLookup[];
  } = {},
) {
  const printedAt = formatStatementPrintedAt();
  const pdfDoc = await PDFDocument.create();
  const fonts = await embedStandardFonts(pdfDoc);
  const { font, fontBold } = fonts;
  const accounting = resolveDonationAccounting(donation, options.feeConfigs ?? {});
  const currency = donation.currency || "EUR";

  const page = pdfDoc.addPage([PDF_PAGE.width, PDF_PAGE.height]);
  let y = PDF_PAGE.height - PDF_MARGIN;

  y = await drawLetterhead(pdfDoc, page, y, branding, fonts, logoPng, {
    combineEmailAndWebsite: true,
    fontScale: RECEIPT_LETTERHEAD_SCALE,
    compact: true,
    ruleGap: RECEIPT_LETTERHEAD_RULE_GAP,
  });

  const titleMetrics = getPdfFontVerticalMetrics(fontBold, RECEIPT_TITLE_SIZE);
  y -=
    titleMetrics.ascent +
    RECEIPT_TITLE_RULE_CLEARANCE -
    RECEIPT_LETTERHEAD_RULE_GAP;

  const title = "Donation Receipt";
  const titleWidth = fontBold.widthOfTextAtSize(title, RECEIPT_TITLE_SIZE);
  page.drawText(title, {
    x: (PDF_PAGE.width - titleWidth) / 2,
    y,
    size: RECEIPT_TITLE_SIZE,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= titleMetrics.descent + 14;

  page.drawText(toPdfSafeText(`Receipt reference: ${donation.id}`), {
    x: PDF_MARGIN,
    y,
    size: 9,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });
  y -= 22;

  const categoryLabel = getCategoryLabel(donation.category, options.categories);
  const donorLabel = donation.donorName?.trim() || "Anonymous";
  const donationDate = formatStatementTableDate(donation.createdAt);
  const transactionId = formatExportTransactionId(
    donation.provider,
    donation.providerId,
  );
  const providerLabel = formatProviderLabel(donation.provider);
  const statusLabel = formatStatementStatus(donation.status);

  const details: Array<{ label: string; value: string; highlight?: boolean }> = [
    { label: "Donor", value: donorLabel },
    { label: "Email", value: donation.donorEmail?.trim() || "Not provided" },
  ];

  if (accounting.processingFeeCents > 0) {
    details.push(
      {
        label: "Charitable gift",
        value: formatDonationCents(accounting.giftAmountCents, currency),
      },
      {
        label: accounting.coverFee ? "Processing fee (covered)" : "Processing fee",
        value: formatDonationCents(accounting.processingFeeCents, currency),
      },
      {
        label: accounting.coverFee ? "Total paid" : "Amount paid",
        value: formatDonationCents(accounting.totalChargedCents, currency),
        highlight: true,
      },
    );

    if (!accounting.coverFee) {
      details.push({
        label: "Net received",
        value: formatDonationCents(accounting.netReceivedCents, currency),
      });
    }
  } else {
    details.push({
      label: "Amount paid",
      value: formatDonationCents(accounting.totalChargedCents, currency),
      highlight: true,
    });
  }

  details.push(
    { label: "Category", value: categoryLabel },
    { label: "Payment method", value: providerLabel },
    { label: "Status", value: statusLabel },
    { label: "Transaction ID", value: transactionId },
    { label: "Donation date", value: donationDate },
  );

  const boxTop = y;
  const rowHeight = 22;
  const boxHeight = details.length * rowHeight + 24;

  page.drawRectangle({
    x: PDF_MARGIN,
    y: boxTop - boxHeight,
    width: PDF_PAGE.width - PDF_MARGIN * 2,
    height: boxHeight,
    color: rgb(0.97, 0.98, 0.97),
    borderColor: BRAND_GOLD,
    borderWidth: 0.5,
  });

  let rowY = boxTop - 18;
  for (const detail of details) {
    page.drawText(detail.label, {
      x: PDF_MARGIN + 14,
      y: rowY,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    const valueX = PDF_MARGIN + 168;
    page.drawText(toPdfSafeText(detail.value), {
      x: valueX,
      y: rowY,
      size: 10,
      font: detail.highlight ? fontBold : font,
      color: detail.highlight ? BRAND_GREEN : rgb(0, 0, 0),
      maxWidth: PDF_PAGE.width - valueX - PDF_MARGIN - 14,
    });

    rowY -= rowHeight;
  }

  y = boxTop - boxHeight - 28;

  page.drawText(
    "Thank you for your generous support. This receipt confirms your donation to our registered charity.",
    {
      x: PDF_MARGIN,
      y,
      size: 10,
      font,
      color: rgb(0, 0, 0),
      maxWidth: PDF_PAGE.width - PDF_MARGIN * 2,
    },
  );

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

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
