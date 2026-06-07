import { format } from "date-fns";

/** Sample seed tag — never show these as real transaction IDs in exports. */
export const SAMPLE_DONATION_TRANSACTION_PREFIX = "sample-export-test";

export function formatStatementPeriodDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(`${value}T12:00:00`);
  return format(date, "dd MMM yyyy");
}

export function formatStatementTableDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return format(date, "dd MMM yyyy HH:mm");
}

export function formatStatementPrintedAt(value: Date = new Date()) {
  return format(value, "dd MMM yyyy 'at' HH:mm");
}

export function formatStatementStatus(status: string) {
  if (!status.trim()) {
    return "—";
  }

  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function isPlaceholderTransactionId(providerId: string) {
  const normalised = providerId.trim().toLowerCase();
  return (
    normalised.startsWith(SAMPLE_DONATION_TRANSACTION_PREFIX) ||
    normalised.includes("sample-export") ||
    normalised.startsWith("test-") ||
    normalised.startsWith("demo-")
  );
}

/**
 * Formats provider transaction IDs for statement exports.
 * TODO: Backfill PayPal capture IDs for legacy rows where providerId was never stored.
 */
export function formatExportTransactionId(
  provider: string,
  providerId: string | null | undefined,
): string {
  const normalisedProvider = provider.trim().toLowerCase();

  if (!providerId?.trim() || isPlaceholderTransactionId(providerId)) {
    if (normalisedProvider === "paypal") {
      return "not recorded";
    }

    if (!providerId?.trim()) {
      return "—";
    }

    return "not recorded";
  }

  return providerId.trim();
}

export function buildStatementFooterPrimaryLine(input: {
  charityNumber: string;
  siteName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}) {
  return [
    `Registered charity number: ${input.charityNumber}`,
    input.siteName,
    input.address,
    `Tel: ${input.phone}`,
    `Email: ${input.email}`,
    input.website,
  ].join(" · ");
}

export function buildStatementFooterSecondaryLine(
  pageNumber: number,
  totalPages: number,
  printedAt: string,
) {
  return `Page ${pageNumber} of ${totalPages} · Printed: ${printedAt}`;
}
