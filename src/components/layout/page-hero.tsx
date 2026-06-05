import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  badge: string;
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  className?: string;
}

export function PageHero({
  badge,
  title,
  description,
  image,
  imageAlt,
  className,
}: PageHeroProps) {
  if (image) {
    return (
      <section
        className={cn(
          "relative flex min-h-[42vh] items-end overflow-hidden md:min-h-[48vh]",
          className
        )}
      >
        <div className="image-frame image-frame-hero absolute inset-0">
          <Image
            src={image}
            alt={imageAlt ?? title}
            fill
            priority
            className="object-cover brightness-105"
            sizes="100vw"
          />
        </div>
        <div className="section-container relative z-10 py-section-sm md:py-section">
          <Badge variant="outline" className="mb-4 border-gold text-gold">
            {badge}
          </Badge>
          <h1 className="heading-display mb-6 max-w-4xl text-balance text-white">
            {title}
          </h1>
          <p className="max-w-3xl text-lg text-neutral-200">{description}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("section-padding bg-secondary/30", className)}>
      <div className="section-container">
        <Badge variant="outline" className="mb-4 border-gold text-gold">
          {badge}
        </Badge>
        <h1 className="heading-display mb-6">{title}</h1>
        <p className="max-w-3xl text-lg text-muted-foreground">{description}</p>
      </div>
    </section>
  );
}
