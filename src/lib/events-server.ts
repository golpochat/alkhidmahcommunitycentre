import "server-only";

import { db } from "@/lib/db";
import { slugify } from "@/lib/events";

export async function assertUniqueEventTitle(
  title: string,
  excludeId?: string
) {
  const existing = await db.event.findFirst({
    where: {
      title: { equals: title.trim(), mode: "insensitive" },
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });

  if (existing) {
    throw new Error("An event with this title already exists");
  }
}

export async function generateUniqueEventSlug(
  title: string,
  excludeId?: string
) {
  let base = slugify(title);
  if (!base) {
    base = "event";
  }

  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await db.event.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    if (!existing) {
      return candidate;
    }
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}
