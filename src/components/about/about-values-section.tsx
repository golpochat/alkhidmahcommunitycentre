import { Card, CardContent } from "@/components/ui/card";
import { ABOUT_VALUE_ICON_MAP } from "@/lib/about-value-icons";
import type { AboutValue } from "@/lib/about-content-types";

interface AboutValuesSectionProps {
  values: AboutValue[];
}

export function AboutValuesSection({ values }: AboutValuesSectionProps) {
  return (
    <section className="section-padding">
      <div className="section-container">
        <h2 className="heading-section mb-10 text-center">Our Values</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => {
            const Icon = ABOUT_VALUE_ICON_MAP[value.icon];

            return (
              <Card key={value.id} className="card-mosque text-center">
                <CardContent className="pt-6">
                  <Icon className="mx-auto mb-4 h-10 w-10 text-gold" />
                  <h3 className="mb-2 font-heading text-lg font-semibold">
                    {value.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
