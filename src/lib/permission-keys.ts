import { DISPLAY_ADMIN_NAV_LABEL } from "@/lib/constants";

export const PERMISSIONS = {
  users: {
    manage: "users.manage",
  },
  settings: {
    manage: "settings.manage",
  },
  events: {
    manage: "events.manage",
    delete: "events.delete",
  },
  gallery: {
    manage: "gallery.manage",
    delete: "gallery.delete",
  },
  education: {
    manage: "education.manage",
    delete: "education.delete",
  },
  donations: {
    manage: "donations.manage",
  },
  prayerTimes: {
    manage: "prayer_times.manage",
  },
  display: {
    manage: "display.manage",
  },
  about: {
    manage: "about.manage",
  },
  legal: {
    manage: "legal.manage",
  },
  registrations: {
    manage: "registrations.manage",
  },
  contact: {
    manage: "contact.manage",
  },
  content: {
    write: "content.write",
    audit: "content.audit",
  },
} as const;

export type PermissionKey =
  | typeof PERMISSIONS.users.manage
  | typeof PERMISSIONS.settings.manage
  | typeof PERMISSIONS.events.manage
  | typeof PERMISSIONS.events.delete
  | typeof PERMISSIONS.gallery.manage
  | typeof PERMISSIONS.gallery.delete
  | typeof PERMISSIONS.education.manage
  | typeof PERMISSIONS.education.delete
  | typeof PERMISSIONS.donations.manage
  | typeof PERMISSIONS.prayerTimes.manage
  | typeof PERMISSIONS.display.manage
  | typeof PERMISSIONS.about.manage
  | typeof PERMISSIONS.legal.manage
  | typeof PERMISSIONS.registrations.manage
  | typeof PERMISSIONS.contact.manage
  | typeof PERMISSIONS.content.write
  | typeof PERMISSIONS.content.audit;

export const ALL_PERMISSION_KEYS: PermissionKey[] = [
  PERMISSIONS.users.manage,
  PERMISSIONS.settings.manage,
  PERMISSIONS.events.manage,
  PERMISSIONS.events.delete,
  PERMISSIONS.gallery.manage,
  PERMISSIONS.gallery.delete,
  PERMISSIONS.education.manage,
  PERMISSIONS.education.delete,
  PERMISSIONS.donations.manage,
  PERMISSIONS.prayerTimes.manage,
  PERMISSIONS.display.manage,
  PERMISSIONS.about.manage,
  PERMISSIONS.legal.manage,
  PERMISSIONS.registrations.manage,
  PERMISSIONS.contact.manage,
  PERMISSIONS.content.write,
  PERMISSIONS.content.audit,
];

export const PERMISSION_GROUP_LABELS: Record<string, string> = {
  users: "Users",
  settings: "Settings",
  events: "Events",
  gallery: "Gallery",
  education: "Education",
  donations: "Donations",
  prayer_times: "Prayer times",
  display: DISPLAY_ADMIN_NAV_LABEL,
  about: "About page",
  legal: "Legal policies",
  registrations: "Registrations",
  contact: "Contact",
  content: "Content",
};
