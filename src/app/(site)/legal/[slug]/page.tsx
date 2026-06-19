import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { LegalPolicyMarkdown } from "@/components/legal/legal-policy-markdown";
import { Badge } from "@/components/ui/badge";
import { createPageMetadata } from "@/lib/metadata";
import { getRenderedLegalPolicyBySlug, isLegalPolicySlug } from "@/lib/legal-policies";

interface LegalPolicyPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: LegalPolicyPageProps) {
  if (!isLegalPolicySlug(params.slug)) {
    return createPageMetadata("Policy not found", "The requested policy could not be found.");
  }

  const policy = await getRenderedLegalPolicyBySlug(params.slug, { publishedOnly: true });
  if (!policy) {
    return createPageMetadata("Policy not found", "The requested policy could not be found.");
  }

  return createPageMetadata(policy.title, policy.summary ?? policy.title);
}

export default async function LegalPolicyPage({ params }: LegalPolicyPageProps) {
  if (!isLegalPolicySlug(params.slug)) {
    notFound();
  }

  const policy = await getRenderedLegalPolicyBySlug(params.slug, { publishedOnly: true });
  if (!policy) {
    notFound();
  }

  return (
    <section className="section-padding">
      <div className="section-container max-w-3xl">
        <div className="mb-8">
          <Link href="/legal" className="text-sm text-gold hover:underline">
            ← All legal policies
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-gold/30 text-gold">
              Version {policy.version}
            </Badge>
            {policy.effectiveDate ? (
              <span className="text-sm text-muted-foreground">
                Effective {format(new Date(policy.effectiveDate), "d MMMM yyyy")}
              </span>
            ) : null}
          </div>
        </div>

        <LegalPolicyMarkdown content={policy.content} />
      </div>
    </section>
  );
}
