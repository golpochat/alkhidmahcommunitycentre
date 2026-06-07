import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { CommitteeMember } from "@/types";

interface AboutCommitteeSectionProps {
  committee: CommitteeMember[];
}

export function AboutCommitteeSection({ committee }: AboutCommitteeSectionProps) {
  if (committee.length === 0) {
    return null;
  }

  return (
    <section className="section-padding bg-secondary/30">
      <div className="section-container">
        <h2 className="heading-section mb-10 text-center">Mosque Committee</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {committee.map((member) => (
            <Card key={member.id} className="card-mosque text-center">
              <CardContent className="pt-6">
                <Avatar className="avatar-islamic mx-auto mb-4 h-24 w-24">
                  <AvatarFallback className="avatar-islamic text-lg font-semibold">
                    {member.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-heading text-lg font-semibold">{member.name}</h3>
                <p className="mb-2 text-sm text-gold">{member.role}</p>
                <p className="text-sm text-muted-foreground">{member.bio}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
