"use client";

import { Clock, Euro, GraduationCap, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ClassRegistrationForm } from "@/components/classes/class-registration-form";
import { formatClassFee, type SerializedClass } from "@/lib/classes";

interface ClassDetailProps {
  classItem: SerializedClass;
}

export function ClassDetail({ classItem }: ClassDetailProps) {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
      <div>
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="outline" className="border-gold text-gold">
            {formatClassFee(classItem.fee)}
          </Badge>
          {classItem.ageGroup && (
            <Badge variant="secondary">{classItem.ageGroup}</Badge>
          )}
        </div>

        <h1 className="heading-display mb-6">{classItem.title}</h1>
        <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
          {classItem.description}
        </p>

        <div className="space-y-4 rounded-lg border border-border bg-card p-6">
          {classItem.schedule && (
            <div className="flex items-start gap-3">
              <Clock className="mt-1 h-5 w-5 shrink-0 text-gold" />
              <div>
                <p className="font-medium">Schedule</p>
                <p className="text-muted-foreground">{classItem.schedule}</p>
              </div>
            </div>
          )}
          {classItem.teacher && (
            <div className="flex items-start gap-3">
              <User className="mt-1 h-5 w-5 shrink-0 text-gold" />
              <div>
                <p className="font-medium">Teacher</p>
                <p className="text-muted-foreground">{classItem.teacher}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Euro className="mt-1 h-5 w-5 shrink-0 text-gold" />
            <div>
              <p className="font-medium">Fee</p>
              <p className="text-muted-foreground">{formatClassFee(classItem.fee)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <GraduationCap className="mt-1 h-5 w-5 shrink-0 text-gold" />
            <div>
              <p className="font-medium">Programme</p>
              <p className="text-muted-foreground">Qur&apos;an &amp; Islamic Studies</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gold/20 bg-secondary/20 p-6">
        <h2 className="mb-2 font-heading text-2xl font-semibold">Register for this class</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Complete the form below and we will contact you with enrolment details.
        </p>
        <ClassRegistrationForm
          classId={classItem.id}
          classTitle={classItem.title}
        />
      </div>
    </div>
  );
}
