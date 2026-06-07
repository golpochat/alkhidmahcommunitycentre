import "server-only";

import { db } from "@/lib/db";

export async function listMemberRegistrations(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  return db.registration.findMany({
    where: {
      email: { equals: normalizedEmail, mode: "insensitive" },
    },
    include: {
      class: {
        select: {
          title: true,
          slug: true,
          schedule: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export interface SerializedMemberRegistration {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  classTitle: string;
  classSlug: string;
  classSchedule: string | null;
  createdAt: string;
}

export function serializeMemberRegistration(
  row: Awaited<ReturnType<typeof listMemberRegistrations>>[number],
): SerializedMemberRegistration {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    notes: row.notes,
    classTitle: row.class.title,
    classSlug: row.class.slug,
    classSchedule: row.class.schedule,
    createdAt: row.createdAt.toISOString(),
  };
}
