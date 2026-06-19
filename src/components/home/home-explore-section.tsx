import {
  ArrowRight,
  CalendarDays,
  GraduationCap,
  Heart,
  Images,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EDUCATION_NAV_LABEL, EDUCATION_PATH } from "@/lib/constants";

const EXPLORE_LINKS = [
  {
    href: "/donations",
    title: "Donate",
    description: "Support prayer, education, and community outreach.",
    icon: Heart,
  },
  {
    href: "/events",
    title: "Events",
    description: "Community gatherings, programmes, and special occasions.",
    icon: CalendarDays,
  },
  {
    href: EDUCATION_PATH,
    title: EDUCATION_NAV_LABEL,
    description: "Qur'an, Arabic, and Islamic classes for all ages.",
    icon: GraduationCap,
  },
  {
    href: "/gallery",
    title: "Gallery",
    description: "Photos from prayer, education, and community life.",
    icon: Images,
  },
] as const;

export function HomeExploreSection() {
  return (
    <section className="section-padding bg-secondary/30">
      <div className="section-container">
        <div className="mb-8 text-center">
          <Badge variant="outline" className="mb-4 border-gold text-gold">
            Explore
          </Badge>
          <h2 className="heading-section">More at the Centre</h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            Donations, events, classes, and photos each have their own page.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EXPLORE_LINKS.map(({ href, title, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex h-full flex-col rounded-lg border border-border bg-background p-5 transition-colors hover:border-gold/40 hover:shadow-card-hover"
            >
              <Icon className="mb-3 h-6 w-6 text-gold" aria-hidden />
              <h3 className="mb-2 font-heading text-lg font-semibold group-hover:text-gold">
                {title}
              </h3>
              <p className="mb-4 flex-1 text-sm text-muted-foreground">
                {description}
              </p>
              <span className="inline-flex items-center text-sm font-medium text-gold">
                View page
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
