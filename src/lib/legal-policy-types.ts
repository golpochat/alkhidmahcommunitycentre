export const LEGAL_POLICY_SLUGS = {
  privacy: "privacy-policy",
  cookies: "cookie-policy",
  terms: "terms-of-use",
} as const;

export type LegalPolicySlug =
  (typeof LEGAL_POLICY_SLUGS)[keyof typeof LEGAL_POLICY_SLUGS];

export const LEGAL_POLICY_SLUG_LIST: LegalPolicySlug[] = [
  LEGAL_POLICY_SLUGS.privacy,
  LEGAL_POLICY_SLUGS.cookies,
  LEGAL_POLICY_SLUGS.terms,
];

export interface SerializedLegalPolicy {
  id: string;
  slug: LegalPolicySlug;
  title: string;
  summary: string | null;
  content: string;
  published: boolean;
  version: string;
  effectiveDate: string | null;
  lastReviewedAt: string | null;
  sortOrder: number;
  updatedAt: string;
}

export interface LegalPolicyListItem {
  id: string;
  slug: LegalPolicySlug;
  title: string;
  summary: string | null;
  published: boolean;
  version: string;
  sortOrder: number;
  updatedAt: string;
}

export interface LegalPolicyPlaceholders {
  siteName: string;
  charityNumber: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

/** Database row shape for legal policies (matches Prisma `LegalPolicy` model). */
export interface LegalPolicyRecord {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  published: boolean;
  version: string;
  effectiveDate: Date | null;
  lastReviewedAt: Date | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
