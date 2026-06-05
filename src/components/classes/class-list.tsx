"use client";

import { ClassCard } from "@/components/classes/class-card";
import type { SerializedClass } from "@/lib/classes";

interface ClassListProps {
  classes: SerializedClass[];
  onRegister?: (classItem: SerializedClass) => void;
}

export function ClassList({ classes, onRegister }: ClassListProps) {
  if (classes.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        No education programmes are available at the moment. Please check back soon.
      </p>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {classes.map((classItem) => (
        <ClassCard key={classItem.id} classItem={classItem} onRegister={onRegister} />
      ))}
    </div>
  );
}
