export interface SerializedClass {
  id: string;
  title: string;
  slug: string;
  description: string;
  ageGroup: string | null;
  schedule: string | null;
  fee: number | null;
  teacher: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedRegistration {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  classId: string;
  classTitle: string;
  classSlug: string;
  createdAt: string;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function serializeClass(cls: {
  id: string;
  title: string;
  slug: string;
  description: string;
  ageGroup: string | null;
  schedule: string | null;
  fee: number | null;
  teacher: string | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}): SerializedClass {
  return {
    id: cls.id,
    title: cls.title,
    slug: cls.slug,
    description: cls.description,
    ageGroup: cls.ageGroup,
    schedule: cls.schedule,
    fee: cls.fee,
    teacher: cls.teacher,
    published: cls.published,
    createdAt: cls.createdAt.toISOString(),
    updatedAt: cls.updatedAt.toISOString(),
  };
}

export function serializeRegistration(
  registration: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    notes: string | null;
    classId: string;
    createdAt: Date;
    class: { title: string; slug: string };
  }
): SerializedRegistration {
  return {
    id: registration.id,
    name: registration.name,
    email: registration.email,
    phone: registration.phone,
    notes: registration.notes,
    classId: registration.classId,
    classTitle: registration.class.title,
    classSlug: registration.class.slug,
    createdAt: registration.createdAt.toISOString(),
  };
}

export function formatClassFee(fee: number | null | undefined) {
  if (fee == null || fee <= 0) return "Free";
  return `€${fee}`;
}
