"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminClassesTable } from "@/components/admin/admin-classes-table";
import type { SerializedClass } from "@/lib/classes";
import { EDUCATION_API_PATH } from "@/lib/constants";

export function AdminClassesManager() {
  const [classes, setClasses] = useState<SerializedClass[]>([]);
  const [canDelete, setCanDelete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClasses() {
      try {
        const [classesResponse, sessionResponse] = await Promise.all([
          fetch(EDUCATION_API_PATH),
          fetch("/api/auth/session"),
        ]);

        if (classesResponse.ok) {
          const data = await classesResponse.json();
          setClasses(Array.isArray(data) ? data : []);
        }

        if (sessionResponse.ok) {
          const session = await sessionResponse.json();
          setCanDelete(Boolean(session.canDeleteClasses));
        }
      } finally {
        setLoading(false);
      }
    }

    loadClasses();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return <AdminClassesTable classes={classes} canDelete={canDelete} />;
}
