import type { Donation } from "@prisma/client";
import {
  getDonationStatementBranding,
  loadStatementLogoPng,
} from "@/lib/donation-statement-branding";
import {
  donationFromRecord,
  donationReceiptToPdfBuffer,
  receiptPdfFilename,
} from "@/lib/donation-receipt-pdf";

export async function generateDonationReceiptPdf(donation: Donation) {
  const branding = await getDonationStatementBranding();
  const logoPng = await loadStatementLogoPng(branding.logoPath);
  const buffer = await donationReceiptToPdfBuffer(
    donationFromRecord(donation),
    branding,
    logoPng
  );

  return {
    buffer,
    filename: receiptPdfFilename(donation.id),
    branding,
  };
}
