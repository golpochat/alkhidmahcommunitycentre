import type { Donation } from "@prisma/client";
import { db } from "@/lib/db";
import { loadDonationProviderFeeConfigs } from "@/lib/donation-accounting-server";
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
  const [logoPng, feeConfigs, categories] = await Promise.all([
    loadStatementLogoPng(branding.logoPath),
    loadDonationProviderFeeConfigs(),
    db.donationCategory.findMany({
      select: { slug: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const buffer = await donationReceiptToPdfBuffer(
    donationFromRecord(donation),
    branding,
    logoPng,
    { feeConfigs, categories },
  );

  return {
    buffer,
    filename: receiptPdfFilename(donation.id),
    branding,
  };
}
