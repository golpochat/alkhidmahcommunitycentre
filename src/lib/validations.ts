import { z } from "zod";
import { ADMIN_EVENT_CATEGORIES } from "@/lib/events";

/** Uploaded files stored under /public or absolute CDN URLs */
export const storedImageUrlSchema = z
  .string()
  .min(1, "Image path is required")
  .refine(
    (value) => value.startsWith("/") || /^https?:\/\//i.test(value),
    "Must be a valid uploaded image path or URL"
  );

export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export const classSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  ageGroup: z.string().min(2).optional().nullable(),
  schedule: z.string().min(3).optional().nullable(),
  fee: z.number().int().min(0).optional().nullable(),
  teacher: z.string().min(2).optional().nullable(),
  publishAt: z.string().datetime().optional().nullable(),
  unpublishAt: z.string().datetime().optional().nullable(),
});

export const registrationSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(7, "Please enter a valid phone number").optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const donationFormSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.number().int().min(1, "Minimum donation is €1"),
  donorName: z.string().optional(),
  donorEmail: z.string().email("Please enter a valid email address"),
  provider: z.enum(["stripe", "paypal", "bank_transfer"]),
  coverProcessingFee: z.boolean().optional(),
});

const paymentGatewayTypeSchema = z.enum(["STRIPE", "PAYPAL", "BANK_TRANSFER"]);

export const paymentGatewaySchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    type: paymentGatewayTypeSchema,
    isEnabled: z.boolean().optional(),
    currency: z.string().min(3).max(3),
    publishableKey: z.string().optional(),
    secretKey: z.string().optional(),
    webhookSecret: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    paypalMode: z.enum(["sandbox", "live"]).optional(),
    accountName: z.string().optional(),
    bankName: z.string().optional(),
    iban: z.string().optional(),
    bic: z.string().optional(),
    referenceNote: z.string().optional(),
    feePercent: z.number().min(0).max(100).optional(),
    feeFixedCents: z.number().int().min(0).optional(),
    allowCoverFee: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "STRIPE") {
      if (!data.publishableKey?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Publishable key is required",
          path: ["publishableKey"],
        });
      }
    }

    if (data.type === "PAYPAL") {
      if (!data.clientId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Client ID is required",
          path: ["clientId"],
        });
      }
    }

    if (data.type === "BANK_TRANSFER") {
      if (!data.accountName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Account name is required",
          path: ["accountName"],
        });
      }
      if (!data.iban?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "IBAN is required",
          path: ["iban"],
        });
      }
    }
  });

export type PaymentGatewayFormValues = z.infer<typeof paymentGatewaySchema>;

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const resendVerificationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const inviteUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  roleId: z.string().min(1, "Role is required"),
});

export const staffInvitationSchema = inviteUserSchema;

export const acceptStaffInvitationSchema = z
  .object({
    token: z.string().min(1, "Invitation link is invalid"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const flyerGenerateSchema = z
  .object({
    theme: z.enum(["gold", "ramadan", "multi-category"]),
    categoryId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.theme !== "multi-category" && !data.categoryId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Category is required for this theme",
        path: ["categoryId"],
      });
    }
  });

export const updateUserRoleSchema = z.object({
  roleId: z.string().min(1, "Role is required"),
});

export const userStatusChangeSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().min(3, "Reason is required"),
});

export const userPasswordResetSchema = z.object({
  resetPassword: z.literal(true),
  reason: z.string().min(3, "Reason is required"),
});

export const permissionCreateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  group: z
    .string()
    .trim()
    .min(2)
    .max(32)
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores"),
});

export const permissionPatchSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
  description: z.string().optional(),
  group: z
    .string()
    .trim()
    .min(2)
    .max(32)
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores")
    .optional(),
  isActive: z.boolean().optional(),
});

export const permissionUpdateSchema = permissionCreateSchema;

export const accessRoleCreateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
});

export const accessRoleMetadataUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const accessRolePermissionsUpdateSchema = z.object({
  permissionIds: z.array(z.string()),
});

export const eventFormSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    category: z.enum(ADMIN_EVENT_CATEGORIES).optional().nullable(),
    startAt: z.string().datetime({ message: "Start date/time is required" }),
    endAt: z.string().datetime().optional().nullable(),
    location: z.string().min(2).optional().nullable(),
    imageUrl: z
      .union([storedImageUrlSchema, z.literal("")])
      .optional()
      .nullable(),
    publishAt: z.string().datetime().optional().nullable(),
    unpublishAt: z.string().datetime().optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.endAt) return true;
      return new Date(data.endAt) >= new Date(data.startAt);
    },
    { message: "End time must be after start time", path: ["endAt"] }
  );

/** @deprecated Use eventFormSchema */
export const eventSchema = eventFormSchema;

export const eventPublishSchema = z.object({
  published: z.boolean(),
});

/** Shared schema for published/unpublished toggles */
export const publishStatusSchema = eventPublishSchema;

export const donationCategoryUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500),
});

export const donationCategoryCreateSchema = donationCategoryUpdateSchema;

export const galleryAlbumSchema = z.object({
  name: z
    .string()
    .min(2, "Album name must be at least 2 characters")
    .max(80, "Album name must be at most 80 characters"),
});

export const galleryAlbumUpdateSchema = galleryAlbumSchema;

export const gallerySchema = z.object({
  albumId: z.string().min(1, "Album is required"),
  title: z.string().min(2).optional().nullable(),
  category: z
    .enum(["ramadan", "eid", "classes", "youth", "community"])
    .optional()
    .nullable(),
  imageUrl: storedImageUrlSchema,
});

export const prayerTimesOverrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  eidDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  jumuahDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  eidType: z.enum(["FITR", "ADHA"]).nullable().optional(),
  eidShowOnFrontend: z.boolean().optional(),
  fajrAdhan: z.string().optional().nullable(),
  fajrIqama: z.string().optional().nullable(),
  dhuhrAdhan: z.string().optional().nullable(),
  dhuhrIqama: z.string().optional().nullable(),
  asrAdhan: z.string().optional().nullable(),
  asrIqama: z.string().optional().nullable(),
  maghribAdhan: z.string().optional().nullable(),
  maghribIqama: z.string().optional().nullable(),
  ishaAdhan: z.string().optional().nullable(),
  ishaIqama: z.string().optional().nullable(),
  iqamaConfig: z
    .record(
      z.enum(["fajr", "dhuhr", "asr", "maghrib", "isha"]),
      z.object({
        mode: z.enum(["fixed", "interval", "text", "follows_magrib"]),
        fixed: z.string().optional().nullable(),
        intervalMinutes: z.number().int().optional().nullable(),
        intervalText: z.string().optional().nullable(),
        text: z.string().optional().nullable(),
      })
    )
    .optional(),
  adhanConfig: z
    .record(
      z.enum(["fajr", "dhuhr", "asr", "maghrib", "isha"]),
      z.object({
        mode: z.enum(["offset", "fixed"]),
        offsetMinutes: z.number().int(),
        fixed: z.string().optional().nullable(),
      })
    )
    .optional(),
  eidFitrAdhan1: z.string().optional().nullable(),
  eidFitrIqama1: z.string().optional().nullable(),
  eidFitrAdhan2: z.string().optional().nullable(),
  eidFitrIqama2: z.string().optional().nullable(),
  eidAdhaAdhan1: z.string().optional().nullable(),
  eidAdhaIqama1: z.string().optional().nullable(),
  eidAdhaAdhan2: z.string().optional().nullable(),
  eidAdhaIqama2: z.string().optional().nullable(),
  eidPrayers: z
    .array(
      z.object({
        index: z.number().int().min(1),
        time: z.string().optional().nullable(),
      })
    )
    .optional(),
  jumuah: z
    .array(
      z.object({
        index: z.number().int().min(1),
        adhan: z.string().optional().nullable(),
        iqama: z.string().optional().nullable(),
      })
    )
    .optional(),
  section: z.enum(["daily", "jumuah", "eid"]).optional(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
export type ClassFormValues = z.infer<typeof classSchema>;
export type RegistrationFormValues = z.infer<typeof registrationSchema>;
export type DonationFormValues = z.infer<typeof donationFormSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type InviteUserFormValues = z.infer<typeof inviteUserSchema>;
export type AcceptStaffInvitationFormValues = z.infer<
  typeof acceptStaffInvitationSchema
>;
export type EventFormValues = z.infer<typeof eventFormSchema>;
export type GalleryFormValues = z.infer<typeof gallerySchema>;
export type GalleryAlbumFormValues = z.infer<typeof galleryAlbumSchema>;
export type PrayerTimesOverrideFormValues = z.infer<typeof prayerTimesOverrideSchema>;

export const updateProfileNameSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const requestEmailChangeSchema = z.object({
  newEmail: z.string().email("Please enter a valid email address"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type UpdateProfileNameFormValues = z.infer<typeof updateProfileNameSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
export type RequestEmailChangeFormValues = z.infer<typeof requestEmailChangeSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const smtpEncryptionSchema = z.enum(["NONE", "TLS", "SSL"]);

export const smtpEmailSettingSchema = z.object({
  provider: z.string().min(1, "Provider name is required"),
  smtpHost: z.string().min(1, "SMTP host is required"),
  smtpPort: z.number().int().min(1).max(65535),
  encryption: smtpEncryptionSchema,
  smtpUsername: z.string().min(1, "SMTP username is required"),
  smtpPassword: z.string().optional(),
  fromEmail: z.string().email("Please enter a valid from email"),
  fromName: z.string().min(1, "From name is required"),
  isDefault: z.boolean().optional(),
});

export const emailTestSchema = z.object({
  to: z.string().email("Please enter a valid email address").optional(),
  settingId: z.string().optional(),
});

export type SmtpEmailSettingFormValues = z.infer<typeof smtpEmailSettingSchema>;
export type EmailTestFormValues = z.infer<typeof emailTestSchema>;

export const displayNoticeSchema = z.object({
  title: z.string().min(2, "Title is required").max(120),
  message: z.string().min(2, "Message is required").max(500),
  priority: z.enum(["high", "medium", "low"]),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

export const displaySettingsSchema = z.object({
  rotationSpeed: z.number().int().min(5).max(120),
  enabledPanels: z.array(
    z.enum(["announcements", "events", "ayat", "weather"])
  ),
  theme: z.enum(["hybrid", "dark", "light"]),
  pinCode: z.string().max(8).optional().nullable(),
  brightnessSchedule: z.unknown().optional().nullable(),
  orientationOverride: z.enum(["landscape", "portrait"]).nullable().optional(),
  autoFullscreen: z.boolean().optional(),
});

export const ayahRotationSchema = z.object({
  arabic: z.string().min(2).max(500),
  english: z.string().min(2).max(500),
  source: z.string().min(2).max(120),
});

export type DisplayNoticeFormValues = z.infer<typeof displayNoticeSchema>;
export type DisplaySettingsFormValues = z.infer<typeof displaySettingsSchema>;
export type AyahRotationFormValues = z.infer<typeof ayahRotationSchema>;
