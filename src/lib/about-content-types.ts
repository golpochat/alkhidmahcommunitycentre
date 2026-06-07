export const ABOUT_VALUE_ICON_KEYS = [
  "book",
  "heart",
  "users",
  "award",
] as const;

export type AboutValueIconKey = (typeof ABOUT_VALUE_ICON_KEYS)[number];

export interface AboutValue {
  id: string;
  icon: AboutValueIconKey;
  title: string;
  description: string;
}

export interface AboutPageContent {
  valuesVisible: boolean;
  committeeVisible: boolean;
  values: AboutValue[];
  committee: import("@/types").CommitteeMember[];
}

export const ABOUT_SETTING_KEYS = {
  valuesVisible: "about_values_visible",
  committeeVisible: "about_committee_visible",
  values: "about_values",
  committee: "about_committee",
} as const;
