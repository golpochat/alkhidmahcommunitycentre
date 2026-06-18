import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { EducationTeacher } from "@/types";

interface EducationTeachersSectionProps {
  teachers: EducationTeacher[];
}

function teacherInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("");
}

export function EducationTeachersSection({ teachers }: EducationTeachersSectionProps) {
  if (teachers.length === 0) {
    return null;
  }

  return (
    <section className="section-padding bg-secondary/30">
      <div className="section-container">
        <h2 className="heading-section mb-10 text-center">Our Teachers</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {teachers.map((teacher) => (
            <Card key={teacher.id} className="card-mosque text-center">
              <CardContent className="pt-6">
                <Avatar className="avatar-islamic mx-auto mb-4 h-24 w-24">
                  {teacher.imageUrl ? (
                    <AvatarImage src={teacher.imageUrl} alt={teacher.name} />
                  ) : null}
                  <AvatarFallback className="avatar-islamic text-lg font-semibold">
                    {teacherInitials(teacher.name)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-heading text-lg font-semibold">{teacher.name}</h3>
                <p className="mb-2 text-sm text-gold">{teacher.role}</p>
                {teacher.bio ? (
                  <p className="text-sm text-muted-foreground">{teacher.bio}</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
