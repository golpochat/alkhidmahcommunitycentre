import type { LegalPolicyPlaceholders } from "@/lib/legal-policy-types";

export type { LegalPolicyPlaceholders };

export function applyLegalPolicyPlaceholders(
  value: string,
  placeholders: LegalPolicyPlaceholders,
) {
  return value
    .replaceAll("{{siteName}}", placeholders.siteName)
    .replaceAll("{{charityNumber}}", placeholders.charityNumber)
    .replaceAll("{{address}}", placeholders.address)
    .replaceAll("{{phone}}", placeholders.phone)
    .replaceAll("{{email}}", placeholders.email)
    .replaceAll("{{website}}", placeholders.website);
}
