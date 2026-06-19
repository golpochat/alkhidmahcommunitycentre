import type { PrismaClient } from "@prisma/client";
import { LEGAL_POLICY_SEED_TEMPLATES } from "@/lib/legal-policy-templates";

export async function seedLegalPolicies(prisma: PrismaClient) {
  for (const template of LEGAL_POLICY_SEED_TEMPLATES) {
    await prisma.legalPolicy.upsert({
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
