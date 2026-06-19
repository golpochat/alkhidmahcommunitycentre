import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Badge } from "@/components/ui/badge";
import { createPageMetadata } from "@/lib/metadata";
import {
  applyLegalPolicyPlaceholders,
  getLegalPolicyPlaceholders,
  listPublishedLegalPolicies,
} from "@/lib/legal-policies";

export async function generateMetadata() {
  return createPageMetadata(
    "Legal Policies",
    "Privacy Policy, Cookie Policy, and Terms of Use for Al Khidmah Community Centre.",
  );
}

export default async function LegalIndexPage() {
  const [policies, placeholders] = await Promise.all([
    listPublishedLegalPolicies(),
    getLegalPolicyPlaceholders(),
  ]);

  return (
    <>
      <PageHero
        badge="Legal"
        title="Legal Policies"
        description={`Important information about privacy, cookies, and use of the ${placeholders.siteName} website.`}
      />

      <section className="section-padding">
        <div className="section-container max-w-3xl">
          {policies.length === 0 ? (
            <p className="text-muted-foreground">
              Legal policies are being prepared. Please contact us at{" "}
              <a href={`mailto:${placeholders.email}`} className="text-gold hover:underline">
                {placeholders.email}
              </a>{" "}
              if you need information in the meantime.
            </p>
          ) : (
            <div className="space-y-4">
              {policies.map((policy) => (
                <Link
                  key={policy.id}
                  href={`/legal/${policy.slug}`}
                  className="group block rounded-lg border border-border p-5 transition-colors hover:border-gold/40 hover:shadow-card-hover"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <h2 className="font-heading text-xl font-semibold group-hover:text-gold">
                      {applyLegalPolicyPlaceholders(policy.title, placeholders)}
                    </h2>
                    <Badge variant="outline" className="border-gold/30 text-gold">
                      v{policy.version}
                    </Badge>
                  </div>
                  {policy.summary ? (
                    <p className="mb-3 text-muted-foreground">
                      {applyLegalPolicyPlaceholders(policy.summary, placeholders)}
                    </p>
                  ) : null}
                  <span className="inline-flex items-center text-sm font-medium text-gold">
                    Read policy
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
