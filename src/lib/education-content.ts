import "server-only";

import { cache } from "react";
import { db } from "@/lib/db";
import {
  EDUCATION_SETTING_KEYS,
  type EducationPageContent,
} from "@/lib/education-content-types";
import { getSettingsMap } from "@/lib/queries";
import { EDUCATION_TEACHERS } from "@/lib/seed-data";
import type { EducationTeacher } from "@/types";

export type { EducationPageContent } from "@/lib/education-content-types";
export { EDUCATION_SETTING_KEYS } from "@/lib/education-content-types";

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  return value === "true";
}

function parseJsonArray<T>(value: string | undefined, fallback: T[]): T[] {
  if (!value?.trim()) return fallback;

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeTeachers(teachers: EducationTeacher[]): EducationTeacher[] {
  return teachers
    .filter((item) => item.name?.trim() && item.role?.trim())
    .map((item, index) => ({
      id: item.id?.trim() || `teacher-${index + 1}`,
      name: item.name.trim(),
      role: item.role.trim(),
      bio: item.bio?.trim() ?? "",
      imageUrl: item.imageUrl?.trim() ?? "",
      published: item.published !== false,
    }));
}

export function getPublishedEducationTeachers(
  teachers: EducationTeacher[],
): EducationTeacher[] {
  return teachers.filter((teacher) => teacher.published);
}

export const getEducationPageContent = cache(async (): Promise<EducationPageContent> => {
  const map = await getSettingsMap();

  const teachers = normalizeTeachers(
    parseJsonArray(map[EDUCATION_SETTING_KEYS.teachers], EDUCATION_TEACHERS),
  );

  return {
    teachersVisible: parseBoolean(map[EDUCATION_SETTING_KEYS.teachersVisible], true),
    teachers: teachers.length > 0 ? teachers : EDUCATION_TEACHERS,
  };
});

export async function saveEducationPageContent(content: EducationPageContent) {
  const entries: Array<[string, string]> = [
    [EDUCATION_SETTING_KEYS.teachersVisible, String(content.teachersVisible)],
    [
      EDUCATION_SETTING_KEYS.teachers,
      JSON.stringify(normalizeTeachers(content.teachers)),
    ],
  ];

  await Promise.all(
    entries.map(([key, value]) =>
      db.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    ),
  );
}
