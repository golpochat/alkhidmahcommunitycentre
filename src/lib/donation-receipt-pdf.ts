import { format } from "date-fns";
import { PDFDocument, rgb } from "pdf-lib";
import type { Donation } from "@prisma/client";
import { getCategoryLabel } from "@/lib/donations";
import {
  formatDonationCents,
  getDonationTotalCents,
} from "@/lib/donation-processing-fee";
import type { DonationStatementBranding } from "@/lib/donation-statement-branding";
import {
  BRAND_GOLD,
  BRAND_GREEN,
  PDF_MARGIN,
  PDF_PAGE,
  drawLetterhead,
  drawPageFooters,
  embedStandardFonts,
  formatPrintedAt,
} from "@/lib/donation-pdf-layout";

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
  logoPng?: Uint8Array | null
) {
  const printedAt = formatPrintedAt();
  const pdfDoc = await PDFDocument.create();
  const fonts = await embedStandardFonts(pdfDoc);
  const { font, fontBold } = fonts;

  const page = pdfDoc.addPage([PDF_PAGE.width, PDF_PAGE.height]);
  let y = PDF_PAGE.height - PDF_MARGIN;

  y = await drawLetterhead(pdfDoc, page, y, branding, fonts, logoPng);

  page.drawText("Donation Receipt", {
    x: PDF_MARGIN,
    y,
    size: 16,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= 22;

  page.drawText(`Receipt reference: ${donation.id}`, {
    x: PDF_MARGIN,
    y,
    size: 9,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });
  y -= 14;

  page.drawText(`Date printed: ${printedAt}`, {
    x: PDF_MARGIN,
    y,
    size: 9,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });
  y -= 24;

  const categoryLabel = getCategoryLabel(donation.category);
  const donorLabel = donation.donorName?.trim() || "Anonymous";
  const donationDate = format(donation.createdAt, "d MMMM yyyy 'at' HH:mm");
  const totalCents = getDonationTotalCents(donation);
  const amountLabel = formatDonationCents(totalCents, donation.currency);

  const details: Array<{ label: string; value: string }> = [
    { label: "Donor", value: donorLabel },
    { label: "Email", value: donation.donorEmail?.trim() || "Not provided" },
  ];

  if (donation.coverFee && donation.processingFeeCents > 0) {
    details.push(
      { label: "Donation", value: formatDonationCents(donation.amount * 100, donation.currency) },
      {
        label: "Processing fee",
        value: formatDonationCents(donation.processingFeeCents, donation.currency),
      },
      { label: "Total paid", value: amountLabel },
    );
  } else {
    details.push({ label: "Amount", value: amountLabel });
  }

  details.push(
    { label: "Category", value: categoryLabel },
    { label: "Payment method", value: donation.provider },
    { label: "Status", value: donation.status },
    { label: "Transaction ID", value: donation.providerId || "—" },
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

    const valueX = PDF_MARGIN + 150;
    page.drawText(detail.value, {
      x: valueX,
      y: rowY,
      size: 10,
      font: detail.label === "Amount" ? fontBold : font,
      color: detail.label === "Amount" ? BRAND_GREEN : rgb(0, 0, 0),
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
    }
  );

  drawPageFooters(pdfDoc, branding, printedAt, fonts);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
