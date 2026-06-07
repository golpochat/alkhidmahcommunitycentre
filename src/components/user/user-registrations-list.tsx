"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EDUCATION_PATH } from "@/lib/constants";
import type { SerializedMemberRegistration } from "@/lib/user-registrations";

export function UserRegistrationsList() {
  const [registrations, setRegistrations] = useState<SerializedMemberRegistration[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRegistrations() {
      setLoading(true);
      try {
        const response = await fetch("/api/user/registrations");
        if (!response.ok) {
          throw new Error("Failed to load registrations");
        }
        const data = await response.json();
        setRegistrations(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load registrations",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadRegistrations();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <div className="user-portal-empty">
        <p className="mb-6 text-muted-foreground">
          No class registrations are linked to your email yet. When you register
          for a programme using this account email, your sign-ups will appear here.
        </p>
        <ButtonLink href={EDUCATION_PATH} variant="outline">
          Browse programmes
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="user-portal-table-wrap">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Programme</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Registered</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registrations.map((registration) => (
            <TableRow key={registration.id}>
              <TableCell>
                <Link
                  href={`${EDUCATION_PATH}/${registration.classSlug}`}
                  className="user-portal-link font-medium"
                >
                  {registration.classTitle}
                </Link>
              </TableCell>
              <TableCell>
                {registration.classSchedule || "—"}
              </TableCell>
              <TableCell>
                {format(parseISO(registration.createdAt), "d MMM yyyy")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
