"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHero } from "@/components/layout/page-hero";
import { ClassList } from "@/components/classes/class-list";
import { ClassRegistrationForm } from "@/components/classes/class-registration-form";
import { EducationTeachersSection } from "@/components/education/education-teachers-section";
import type { SerializedClass } from "@/lib/classes";
import { IMAGES } from "@/lib/images";
import { EDUCATION_NAV_LABEL, SITE_NAME } from "@/lib/constants";
import type { EducationTeacher } from "@/types";

interface ClassesPageContentProps {
  classes: SerializedClass[];
  teachers?: EducationTeacher[];
  teachersVisible?: boolean;
}

export function ClassesPageContent({
  classes,
  teachers = [],
  teachersVisible = false,
}: ClassesPageContentProps) {
  const [selectedClass, setSelectedClass] = useState<SerializedClass | null>(null);

  return (
    <>
      <PageHero
        badge={EDUCATION_NAV_LABEL}
        title="Qur&apos;an &amp; Islamic Classes"
        description={`Structured learning programmes for children, youth, and adults at ${SITE_NAME}.`}
        image={IMAGES.heroes.classes}
        imageAlt="Qur'an and Islamic education"
      />

      <section className="section-padding">
        <div className="section-container">
          <ClassList classes={classes} onRegister={setSelectedClass} />
        </div>
      </section>

      {teachersVisible && teachers.length > 0 ? (
        <EducationTeachersSection teachers={teachers} />
      ) : null}

      <Dialog open={Boolean(selectedClass)} onOpenChange={(open) => !open && setSelectedClass(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Register for {selectedClass?.title}
            </DialogTitle>
            <DialogDescription>
              Complete the form below and we will contact you with enrolment details.
            </DialogDescription>
          </DialogHeader>
          {selectedClass && (
            <ClassRegistrationForm
              classId={selectedClass.id}
              classTitle={selectedClass.title}
              onSuccess={() => setSelectedClass(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
