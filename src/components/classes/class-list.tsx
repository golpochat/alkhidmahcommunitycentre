"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ClassCard } from "@/components/classes/class-card";
import { Button } from "@/components/ui/button";
import type { SerializedClass } from "@/lib/classes";

const CLASSES_PER_PAGE = 4;

interface ClassListProps {
  classes: SerializedClass[];
  onRegister?: (classItem: SerializedClass) => void;
}

export function ClassList({ classes, onRegister }: ClassListProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(classes.length / CLASSES_PER_PAGE));

  const paginatedClasses = useMemo(() => {
    const start = (page - 1) * CLASSES_PER_PAGE;
    return classes.slice(start, start + CLASSES_PER_PAGE);
  }, [classes, page]);

  if (classes.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        No education programmes are available at the moment. Please check back soon.
      </p>
    );
  }

  return (
    <div className="education-classes-list">
      <div className="grid gap-6 sm:grid-cols-2">
        {paginatedClasses.map((classItem) => (
          <ClassCard key={classItem.id} classItem={classItem} onRegister={onRegister} />
        ))}
      </div>

      {totalPages > 1 ? (
        <div className="education-classes-pagination">
          <p className="education-classes-pagination-summary">
            Showing {(page - 1) * CLASSES_PER_PAGE + 1}–
            {Math.min(page * CLASSES_PER_PAGE, classes.length)} of {classes.length}{" "}
            programmes
          </p>
          <div className="education-classes-pagination-nav">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="education-classes-pagination-page">
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
