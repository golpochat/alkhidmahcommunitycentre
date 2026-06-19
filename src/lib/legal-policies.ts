import "server-only";

import { cache } from "react";
import { db } from "@/lib/db";
import {
  getLegalPolicySeedTemplate,
  LEGAL_POLICY_SEED_TEMPLATES,
} from "@/lib/legal-policy-templates";
import {
  LEGAL_POLICY_SLUG_LIST,
  type LegalPolicyListItem,
  type LegalPolicyRecord,
  type LegalPolicySlug,
  type SerializedLegalPolicy,
} from "@/lib/legal-policy-types";
import { applyLegalPolicyPlaceholders } from "@/lib/legal-policy-placeholders";
import { getSiteBranding } from "@/lib/site-branding";

export { applyLegalPolicyPlaceholders } from "@/lib/legal-policy-placeholders";
export type { LegalPolicyPlaceholders } from "@/lib/legal-policy-placeholders";

type LegalPolicyClient = {
  findMany: (args: {
    orderBy: Array<{ sortOrder: "asc" | "desc" } | { title: "asc" | "desc" }>;
  }) => Promise<LegalPolicyRecord[]>;
  findUnique: (args: {
    where: { slug: string };
  }) => Promise<LegalPolicyRecord | null>;
  upsert: (args: {
    where: { slug: string };
    update: Record<string, unknown>;
    create: Record<string, unknown>;
  }) => Promise<LegalPolicyRecord>;
};

function legalPolicies() {
  return (db as unknown as { legalPolicy: LegalPolicyClient }).legalPolicy;
}

export async function getLegalPolicyPlaceholders() {
  const branding = await getSiteBranding();
  return {
    siteName: branding.siteName,
    charityNumber: branding.charityNumber,
    address: branding.address,
    phone: branding.phone,
    email: branding.email,
    website: branding.siteUrl,
  };
}

function serializeLegalPolicy(row: LegalPolicyRecord): SerializedLegalPolicy {
  return {
    id: row.id,
    slug: row.slug as LegalPolicySlug,
    title: row.title,
    summary: row.summary,
    content: row.content,
    published: row.published,
    version: row.version,
    effectiveDate: row.effectiveDate?.toISOString() ?? null,
    lastReviewedAt: row.lastReviewedAt?.toISOString() ?? null,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function serializeLegalPolicyListItem(
  row: LegalPolicyRecord,
): LegalPolicyListItem {
  return {
    id: row.id,
    slug: row.slug as LegalPolicySlug,
    title: row.title,
    summary: row.summary,
    published: row.published,
    version: row.version,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function seedLegalPoliciesFromDb() {
  for (const template of LEGAL_POLICY_SEED_TEMPLATES) {
    await legalPolicies().upsert({
      where: { slug: template.slug },
      update: {},
      create: {
        slug: template.slug,
        title: template.title,
        summary: template.summary,
        content: template.content,
        sortOrder: template.sortOrder,
        published: false,
        version: "1.0",
      },
    });
  }
}

export async function seedLegalPolicies() {
  await seedLegalPoliciesFromDb();
}

export const listLegalPolicies = cache(async () => {
  const rows = await legalPolicies().findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  if (rows.length === 0) {
    await seedLegalPolicies();
    return legalPolicies().findMany({
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    });
  }

  return rows;
});

export async function listSerializedLegalPolicies() {
  const rows = await listLegalPolicies();
  return rows.map(serializeLegalPolicy);
}

export async function listPublishedLegalPolicies() {
  const rows = await listLegalPolicies();
  return rows.filter((row) => row.published).map(serializeLegalPolicyListItem);
}

export async function getLegalPolicyBySlug(
  slug: string,
  options?: { publishedOnly?: boolean },
) {
  const row = await legalPolicies().findUnique({ where: { slug } });
  if (!row) {
    const template = getLegalPolicySeedTemplate(slug as LegalPolicySlug);
    if (!template) {
      return null;
    }

    await seedLegalPolicies();
    return getLegalPolicyBySlug(slug, options);
  }

  if (options?.publishedOnly && !row.published) {
    return null;
  }

  return serializeLegalPolicy(row);
}

export async function getRenderedLegalPolicyBySlug(
  slug: string,
  options?: { publishedOnly?: boolean },
) {
  const policy = await getLegalPolicyBySlug(slug, options);
  if (!policy) {
    return null;
  }

  const placeholders = await getLegalPolicyPlaceholders();
  return {
    ...policy,
    title: applyLegalPolicyPlaceholders(policy.title, placeholders),
    summary: policy.summary
      ? applyLegalPolicyPlaceholders(policy.summary, placeholders)
      : null,
    content: applyLegalPolicyPlaceholders(policy.content, placeholders),
  };
}

export async function saveLegalPolicy(
  slug: LegalPolicySlug,
  input: {
    title: string;
    summary?: string | null;
    content: string;
    published: boolean;
    version: string;
    effectiveDate?: string | null;
    lastReviewedAt?: string | null;
  },
) {
  if (!LEGAL_POLICY_SLUG_LIST.includes(slug)) {
    throw new Error("Invalid policy slug");
  }

  const template = getLegalPolicySeedTemplate(slug);

  const row = await legalPolicies().upsert({
    where: { slug },
    update: {
      title: input.title.trim(),
      summary: input.summary?.trim() || null,
      content: input.content,
      published: input.published,
      version: input.version.trim() || "1.0",
      effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : null,
      lastReviewedAt: input.lastReviewedAt
        ? new Date(input.lastReviewedAt)
        : null,
    },
    create: {
      slug,
      title: input.title.trim(),
      summary: input.summary?.trim() || template?.summary || null,
      content: input.content,
      published: input.published,
      version: input.version.trim() || "1.0",
      effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : null,
      lastReviewedAt: input.lastReviewedAt
        ? new Date(input.lastReviewedAt)
        : null,
      sortOrder: template?.sortOrder ?? 0,
    },
  });

  return serializeLegalPolicy(row);
}

export function isLegalPolicySlug(value: string): value is LegalPolicySlug {
  return LEGAL_POLICY_SLUG_LIST.includes(value as LegalPolicySlug);
}
