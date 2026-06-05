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
  registrations: {
    manage: "registrations.manage",
  },
  content: {
    write: "content.write",
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
  | typeof PERMISSIONS.registrations.manage
  | typeof PERMISSIONS.content.write;

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
  PERMISSIONS.registrations.manage,
  PERMISSIONS.content.write,
];

export const PERMISSION_GROUP_LABELS: Record<string, string> = {
  users: "Users",
  settings: "Settings",
  events: "Events",
  gallery: "Gallery",
  education: "Education",
  donations: "Donations",
  prayer_times: "Prayer times",
  registrations: "Registrations",
  content: "Content",
};
