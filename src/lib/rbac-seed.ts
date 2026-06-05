import { AccountTier } from "@/lib/account-tier";
import { PERMISSIONS } from "@/lib/permission-keys";

export const DEFAULT_PERMISSIONS = [
  {
    key: PERMISSIONS.users.manage,
    name: "Manage users",
    description: "Invite staff, change roles, and reset passwords",
    group: "users",
  },
  {
    key: PERMISSIONS.settings.manage,
    name: "Manage settings",
    description: "Site, payment, and email configuration",
    group: "settings",
  },
  {
    key: PERMISSIONS.events.manage,
    name: "Manage events",
    description: "Create and edit events",
    group: "events",
  },
  {
    key: PERMISSIONS.events.delete,
    name: "Delete events",
    description: "Remove events from the system",
    group: "events",
  },
  {
    key: PERMISSIONS.gallery.manage,
    name: "Manage gallery",
    description: "Upload and organise gallery albums",
    group: "gallery",
  },
  {
    key: PERMISSIONS.gallery.delete,
    name: "Delete gallery items",
    description: "Remove gallery albums and images",
    group: "gallery",
  },
  {
    key: PERMISSIONS.education.manage,
    name: "Manage education",
    description: "Create and edit education programmes",
    group: "education",
  },
  {
    key: PERMISSIONS.education.delete,
    name: "Delete education programmes",
    description: "Remove programmes and related data",
    group: "education",
  },
  {
    key: PERMISSIONS.donations.manage,
    name: "Manage donations",
    description: "View and export donation records",
    group: "donations",
  },
  {
    key: PERMISSIONS.prayerTimes.manage,
    name: "Manage prayer times",
    description: "Update prayer schedules and overrides",
    group: "prayer_times",
  },
  {
    key: PERMISSIONS.registrations.manage,
    name: "Manage registrations",
    description: "View class and programme registrations",
    group: "registrations",
  },
  {
    key: PERMISSIONS.content.write,
    name: "Write admin content",
    description: "Access create, edit, and upload admin pages",
    group: "content",
  },
] as const;

const ALL_KEYS = DEFAULT_PERMISSIONS.map((permission) => permission.key);

export const DEFAULT_ROLES: Array<{
  slug: string;
  name: string;
  description: string;
  tier: AccountTier;
  isSystem: boolean;
  permissionKeys: string[];
}> = [
  {
    slug: "super-admin",
    name: "Super Admin",
    description: "Full platform access including users and settings",
    tier: AccountTier.SUPER_ADMIN,
    isSystem: true,
    permissionKeys: [...ALL_KEYS],
  },
  {
    slug: "admin",
    name: "Admin",
    description: "Full admin access except users and site settings",
    tier: AccountTier.STAFF,
    isSystem: true,
    permissionKeys: ALL_KEYS.filter(
      (key) =>
        key !== PERMISSIONS.users.manage && key !== PERMISSIONS.settings.manage
    ),
  },
  {
    slug: "editor",
    name: "Editor",
    description: "Manage events and education without delete or upload access",
    tier: AccountTier.STAFF,
    isSystem: true,
    permissionKeys: [
      PERMISSIONS.events.manage,
      PERMISSIONS.education.manage,
      PERMISSIONS.registrations.manage,
      PERMISSIONS.prayerTimes.manage,
    ],
  },
  {
    slug: "web-admin",
    name: "Web Admin",
    description: "Events, gallery, and prayer times with full write access",
    tier: AccountTier.STAFF,
    isSystem: true,
    permissionKeys: [
      PERMISSIONS.events.manage,
      PERMISSIONS.events.delete,
      PERMISSIONS.gallery.manage,
      PERMISSIONS.gallery.delete,
      PERMISSIONS.prayerTimes.manage,
      PERMISSIONS.content.write,
    ],
  },
  {
    slug: "account-admin",
    name: "Account Admin",
    description: "Donations, education programmes, and registrations",
    tier: AccountTier.STAFF,
    isSystem: true,
    permissionKeys: [
      PERMISSIONS.education.manage,
      PERMISSIONS.education.delete,
      PERMISSIONS.donations.manage,
      PERMISSIONS.registrations.manage,
      PERMISSIONS.content.write,
    ],
  },
  {
    slug: "member",
    name: "Member",
    description: "Public member account for donations and registrations",
    tier: AccountTier.MEMBER,
    isSystem: true,
    permissionKeys: [],
  },
];

export const SUPER_ADMIN_ROLE_SLUG = "super-admin";
export const MEMBER_ROLE_SLUG = "member";
