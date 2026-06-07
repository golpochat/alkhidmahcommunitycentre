import "server-only";

import { cache } from "react";
import { db } from "@/lib/db";
import {
  ABOUT_SETTING_KEYS,
  type AboutPageContent,
  type AboutValue,
  type AboutValueIconKey,
} from "@/lib/about-content-types";
import { getSettingsMap } from "@/lib/queries";
import { COMMITTEE_MEMBERS } from "@/lib/seed-data";
import type { CommitteeMember } from "@/types";

export type { AboutPageContent, AboutValue, AboutValueIconKey } from "@/lib/about-content-types";
export { ABOUT_VALUE_ICON_KEYS, ABOUT_SETTING_KEYS } from "@/lib/about-content-types";

const DEFAULT_VALUES: AboutValue[] = [
  {
    id: "value-education",
    icon: "book",
    title: "Education",
    description:
      "Providing Quran and Islamic education for children and adults of all backgrounds.",
  },
  {
    id: "value-charity",
    icon: "heart",
    title: "Charity",
    description:
      "Supporting the needy through zakah, sadaqah, and community welfare programmes.",
  },
  {
    id: "value-community",
    icon: "users",
    title: "Community",
    description:
      "Building a welcoming space for worship, fellowship, and cultural connection.",
  },
  {
    id: "value-excellence",
    icon: "award",
    title: "Excellence",
    description:
      "Upholding the highest standards as a registered and verified charity.",
  },
];

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

function normalizeValueIcon(icon: unknown): AboutValueIconKey {
  if (
    typeof icon === "string" &&
    (["book", "heart", "users", "award"] as const).includes(icon as AboutValueIconKey)
  ) {
    return icon as AboutValueIconKey;
  }
  return "book";
}

function normalizeValues(values: AboutValue[]): AboutValue[] {
  return values
    .filter((item) => item.title?.trim() && item.description?.trim())
    .map((item, index) => ({
      id: item.id?.trim() || `value-${index + 1}`,
      icon: normalizeValueIcon(item.icon),
      title: item.title.trim(),
      description: item.description.trim(),
    }));
}

function normalizeCommittee(members: CommitteeMember[]): CommitteeMember[] {
  return members
    .filter((item) => item.name?.trim() && item.role?.trim())
    .map((item, index) => ({
      id: item.id?.trim() || `member-${index + 1}`,
      name: item.name.trim(),
      role: item.role.trim(),
      bio: item.bio?.trim() ?? "",
      imageUrl: item.imageUrl?.trim() ?? "",
    }));
}

export const getAboutPageContent = cache(async (): Promise<AboutPageContent> => {
  const map = await getSettingsMap();

  const values = normalizeValues(
    parseJsonArray(map[ABOUT_SETTING_KEYS.values], DEFAULT_VALUES),
  );
  const committee = normalizeCommittee(
    parseJsonArray(map[ABOUT_SETTING_KEYS.committee], COMMITTEE_MEMBERS),
  );

  return {
    valuesVisible: parseBoolean(map[ABOUT_SETTING_KEYS.valuesVisible], false),
    committeeVisible: parseBoolean(map[ABOUT_SETTING_KEYS.committeeVisible], false),
    values: values.length > 0 ? values : DEFAULT_VALUES,
    committee: committee.length > 0 ? committee : COMMITTEE_MEMBERS,
  };
});

export async function saveAboutPageContent(content: AboutPageContent) {
  const entries: Array<[string, string]> = [
    [ABOUT_SETTING_KEYS.valuesVisible, String(content.valuesVisible)],
    [ABOUT_SETTING_KEYS.committeeVisible, String(content.committeeVisible)],
    [ABOUT_SETTING_KEYS.values, JSON.stringify(normalizeValues(content.values))],
    [
      ABOUT_SETTING_KEYS.committee,
      JSON.stringify(normalizeCommittee(content.committee)),
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
