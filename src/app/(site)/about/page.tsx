import { Award, BookOpen, Heart, Users } from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHero } from "@/components/layout/page-hero";
import { IMAGES } from "@/lib/images";
import { CONTACT, ABOUT_PAGE_VISIBILITY, SITE_NAME } from "@/lib/constants";
import { COMMITTEE_MEMBERS } from "@/lib/seed-data";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "About Us",
  `Learn about ${SITE_NAME}'s mission, history, and committee serving the Muslim community of Clondalkin.`
);

const values = [
  {
    icon: BookOpen,
    title: "Education",
    description:
      "Providing Quran and Islamic education for children and adults of all backgrounds.",
  },
  {
    icon: Heart,
    title: "Charity",
    description:
      "Supporting the needy through zakah, sadaqah, and community welfare programmes.",
  },
  {
    icon: Users,
    title: "Community",
    description:
      "Building a welcoming space for worship, fellowship, and cultural connection.",
  },
  {
    icon: Award,
    title: "Excellence",
    description:
      "Upholding the highest standards as a registered and verified charity.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        badge="About Us"
        title={`About ${SITE_NAME}`}
        description={`${SITE_NAME} has been a cornerstone of the Muslim community in Clondalkin since 2010, providing a spiritual home for worship, learning, and charitable service.`}
        image={IMAGES.heroes.about}
        imageAlt={`${SITE_NAME} masjid`}
      />

      <section className="section-padding">
        <div className="section-container grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="heading-section mb-6">Our Mission</h2>
            <p className="mb-4 text-muted-foreground">
              To serve the Muslim community of Clondalkin by providing a centre
              for the five daily prayers, Jumuah, Islamic education, and
              charitable outreach — while fostering understanding and good
              relations with our neighbours.
            </p>
            <p className="text-muted-foreground">
              We strive to nurture faith, knowledge, and compassion in every
              member of our community, from the youngest child learning their
              first surah to elders sharing wisdom and experience.
            </p>
          </div>
          <div className="image-frame-card relative aspect-video overflow-hidden rounded-lg">
            <Image
              src={IMAGES.communityGathering}
              alt={`${SITE_NAME} community gathering`}
              fill
              className="object-cover brightness-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="section-padding bg-secondary/30">
        <div className="section-container">
          <h2 className="heading-section mb-6">Our History</h2>
          <div className="max-w-3xl space-y-4 text-muted-foreground">
            <p>
              Founded in 2010 by a group of dedicated community members, Al
              Khidmah Mosque began as a small prayer space serving a handful of
              families in Clondalkin. Through the generosity of donors and
              volunteers, we expanded into a full community centre.
            </p>
            <p>
              Today, we serve hundreds of families with daily prayers, weekend
              Quran classes, youth programmes, Ramadan iftars, and charitable
              initiatives. Our registered charity status ensures transparency
              and accountability in all our financial operations.
            </p>
          </div>

          <Card className="mt-8 max-w-md border-gold/30 bg-gold/5">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold">
                <Award className="h-8 w-8 text-mosque-black" />
              </div>
              <div>
                <p className="font-heading text-lg font-semibold">
                  Verified Charity
                </p>
                <p className="text-sm text-muted-foreground">
                  Registered Charity Number: {CONTACT.charityNumber}
                </p>
                <p className="text-xs text-gold">Revenue Commissioners Approved</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {ABOUT_PAGE_VISIBILITY.values && (
      <section className="section-padding">
        <div className="section-container">
          <h2 className="heading-section mb-10 text-center">Our Values</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <Card key={value.title} className="card-mosque text-center">
                <CardContent className="pt-6">
                  <value.icon className="mx-auto mb-4 h-10 w-10 text-gold" />
                  <h3 className="mb-2 font-heading text-lg font-semibold">
                    {value.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      )}

      {ABOUT_PAGE_VISIBILITY.committee && (
      <section className="section-padding bg-secondary/30">
        <div className="section-container">
          <h2 className="heading-section mb-10 text-center">
            Mosque Committee
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {COMMITTEE_MEMBERS.map((member) => (
              <Card key={member.id} className="card-mosque text-center">
                <CardContent className="pt-6">
                  <Avatar className="avatar-islamic mx-auto mb-4 h-24 w-24">
                    <AvatarFallback className="avatar-islamic text-lg font-semibold">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-heading text-lg font-semibold">
                    {member.name}
                  </h3>
                  <p className="mb-2 text-sm text-gold">{member.role}</p>
                  <p className="text-sm text-muted-foreground">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      )}
    </>
  );
}
