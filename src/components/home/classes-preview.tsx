import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";
import { EDUCATION_NAV_LABEL, EDUCATION_PATH } from "@/lib/constants";
import { getClassImage } from "@/lib/images";
import { formatClassFee, type SerializedClass } from "@/lib/classes";
import { getFeaturedClasses } from "@/lib/queries";

export async function ClassesPreview() {
  const featuredClasses = await getFeaturedClasses(3);

  if (featuredClasses.length === 0) {
    return null;
  }

  return (
    <section className="section-padding bg-secondary/30">
      <div className="section-container">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge variant="outline" className="mb-4 border-gold text-gold">
              {EDUCATION_NAV_LABEL}
            </Badge>
            <h2 className="heading-section">Qur&apos;an &amp; Islamic Classes</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Structured learning for children, youth, and adults at every level.
            </p>
          </div>
          <ButtonLink
            href={EDUCATION_PATH}
            variant="outline"
            className="border-gold text-gold hover:bg-gold hover:text-mosque-black"
          >
            View All Programmes
            <ArrowRight className="ml-2 h-4 w-4" />
          </ButtonLink>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredClasses.map((classItem) => (
            <PreviewCard key={classItem.id} classItem={classItem} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PreviewCard({ classItem }: { classItem: SerializedClass }) {
  return (
    <Link href={`${EDUCATION_PATH}/${classItem.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden border-border transition-all duration-200 hover:border-gold/40 hover:shadow-card-hover">
        <div className="image-frame-card relative aspect-[16/10] w-full overflow-hidden rounded-lg">
          <Image
            src={getClassImage(classItem.slug)}
            alt={classItem.title}
            fill
            className="object-cover brightness-105 transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <Badge variant="outline" className="border-gold/30 text-gold">
              {formatClassFee(classItem.fee)}
            </Badge>
            {classItem.ageGroup && (
              <Badge variant="secondary">{classItem.ageGroup}</Badge>
            )}
          </div>
          <h3 className="mb-3 font-heading text-lg font-semibold transition-colors group-hover:text-gold">
            {classItem.title}
          </h3>
          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
            {classItem.description}
          </p>
          <div className="space-y-1 text-sm text-muted-foreground">
            {classItem.schedule && (
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-gold" />
                {classItem.schedule}
              </p>
            )}
            {classItem.teacher && (
              <p className="flex items-center gap-2">
                <User className="h-4 w-4 shrink-0 text-gold" />
                {classItem.teacher}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
