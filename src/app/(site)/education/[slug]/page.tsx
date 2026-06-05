import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClassDetail } from "@/components/classes/class-detail";
import { getClassBySlug } from "@/lib/queries";
import { EDUCATION_NAV_LABEL, EDUCATION_PATH } from "@/lib/constants";
import { createPageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

interface EducationDetailPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: EducationDetailPageProps) {
  const classItem = await getClassBySlug(params.slug);
  if (!classItem) return createPageMetadata("Programme Not Found", "");
  return createPageMetadata(classItem.title, classItem.description);
}

export default async function EducationDetailPage({
  params,
}: EducationDetailPageProps) {
  const classItem = await getClassBySlug(params.slug);

  if (!classItem) {
    notFound();
  }

  return (
    <section className="section-padding">
      <div className="section-container">
        <Link
          href={EDUCATION_PATH}
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {EDUCATION_NAV_LABEL}
        </Link>
        <ClassDetail classItem={classItem} />
      </div>
    </section>
  );
}
