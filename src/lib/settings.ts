import { DEFAULT_DONATION_CURRENCY } from "@/lib/donation-processing-fee";

export const SETTING_KEYS = {
  siteName: "site_name",
  siteUrl: "site_url",
  charityNumber: "charity_number",
  contactAddress: "contact_address",
  contactPhone: "contact_phone",
  contactEmail: "contact_email",
  contactWhatsapp: "contact_whatsapp",
  socialFacebook: "social_facebook",
  socialInstagram: "social_instagram",
  socialYoutube: "social_youtube",
  socialTwitter: "social_twitter",
  logoPath: "logo_path",
  faviconPath: "favicon_path",
  stripeEnabled: "stripe_enabled",
  stripePublishableKey: "stripe_publishable_key",
  stripeSecretKey: "stripe_secret_key",
  stripeWebhookSecret: "stripe_webhook_secret",
  paypalEnabled: "paypal_enabled",
  paypalClientId: "paypal_client_id",
  paypalClientSecret: "paypal_client_secret",
  paypalMode: "paypal_mode",
  donationCurrency: "donation_currency",
  smtpHost: "smtp_host",
  smtpPort: "smtp_port",
  smtpSecure: "smtp_secure",
  smtpUser: "smtp_user",
  smtpPass: "smtp_pass",
  smtpFrom: "smtp_from",
  notificationEmail: "notification_email",
  ramadanActiveYear: "ramadan_active_year",
  ramadanPdfPath: "ramadan_pdf_path",
  monthlyTimetableMonth: "monthly_timetable_month",
  monthlyTimetableYear: "monthly_timetable_year",
  monthlyTimetablePublished: "monthly_timetable_published",
  ramadanTimetableHomePublished: "ramadan_timetable_home_published",
  prayerTimetablesHomeBannerVisible: "prayer_timetables_home_banner_visible",
} as const;

export const DEFAULT_SETTINGS: Record<string, string> = {
  [SETTING_KEYS.siteName]: "Al Khidmah Community Centre",
  [SETTING_KEYS.charityNumber]: "CHY 22345",
  [SETTING_KEYS.contactAddress]:
    "Unit 4, Monastery Road, Clondalkin, Dublin 22, D22 YX82",
  [SETTING_KEYS.contactPhone]: "+353 1 457 8900",
  [SETTING_KEYS.contactEmail]: "info@alkhidmahmosque.ie",
  [SETTING_KEYS.contactWhatsapp]: "+353851234567",
  [SETTING_KEYS.socialFacebook]: "https://facebook.com/alkhidmahmosque",
  [SETTING_KEYS.socialInstagram]: "https://instagram.com/alkhidmahmosque",
  [SETTING_KEYS.socialYoutube]: "https://youtube.com/@alkhidmahmosque",
  [SETTING_KEYS.socialTwitter]: "https://twitter.com/alkhidmahmosque",
  [SETTING_KEYS.logoPath]: "/logo/logo.png",
  [SETTING_KEYS.faviconPath]: "/favicon.png",
  [SETTING_KEYS.stripeEnabled]: "true",
  [SETTING_KEYS.stripePublishableKey]: "",
  [SETTING_KEYS.stripeSecretKey]: "",
  [SETTING_KEYS.stripeWebhookSecret]: "",
  [SETTING_KEYS.paypalEnabled]: "true",
  [SETTING_KEYS.paypalClientId]: "",
  [SETTING_KEYS.paypalClientSecret]: "",
  [SETTING_KEYS.paypalMode]: "sandbox",
  [SETTING_KEYS.donationCurrency]: DEFAULT_DONATION_CURRENCY,
  [SETTING_KEYS.smtpHost]: "",
  [SETTING_KEYS.smtpPort]: "587",
  [SETTING_KEYS.smtpSecure]: "false",
  [SETTING_KEYS.smtpUser]: "",
  [SETTING_KEYS.smtpPass]: "",
  [SETTING_KEYS.smtpFrom]: "",
  [SETTING_KEYS.notificationEmail]: "info@alkhidmahmosque.ie",
  [SETTING_KEYS.siteUrl]: "https://alkhidmah.ie",
  [SETTING_KEYS.ramadanActiveYear]: "",
  [SETTING_KEYS.monthlyTimetableMonth]: "",
  [SETTING_KEYS.monthlyTimetableYear]: "",
  [SETTING_KEYS.monthlyTimetablePublished]: "",
  [SETTING_KEYS.ramadanTimetableHomePublished]: "",
  [SETTING_KEYS.prayerTimetablesHomeBannerVisible]: "true",
};

export const ADMIN_SETTING_FIELDS = [
  { key: SETTING_KEYS.siteName, label: "Centre Name", type: "text" as const },
  { key: SETTING_KEYS.charityNumber, label: "Charity Registration Number", type: "text" as const },
  { key: SETTING_KEYS.siteUrl, label: "Website URL", type: "url" as const },
  { key: SETTING_KEYS.contactAddress, label: "Address", type: "text" as const },
  { key: SETTING_KEYS.contactPhone, label: "Phone", type: "text" as const },
  { key: SETTING_KEYS.contactEmail, label: "Email", type: "email" as const },
  {
    key: SETTING_KEYS.notificationEmail,
    label: "Notification Email",
    type: "email" as const,
  },
  { key: SETTING_KEYS.contactWhatsapp, label: "WhatsApp", type: "text" as const },
  { key: SETTING_KEYS.socialFacebook, label: "Facebook URL", type: "url" as const },
  { key: SETTING_KEYS.socialInstagram, label: "Instagram URL", type: "url" as const },
  { key: SETTING_KEYS.socialYoutube, label: "YouTube URL", type: "url" as const },
  { key: SETTING_KEYS.socialTwitter, label: "X (Twitter) URL", type: "url" as const },
];

export const PAYMENT_SETTING_FIELDS = [
  {
    key: SETTING_KEYS.stripePublishableKey,
    label: "Stripe Publishable Key",
    type: "text" as const,
  },
  {
    key: SETTING_KEYS.stripeSecretKey,
    label: "Stripe Secret Key",
    type: "password" as const,
  },
  {
    key: SETTING_KEYS.stripeWebhookSecret,
    label: "Stripe Webhook Secret",
    type: "password" as const,
  },
  {
    key: SETTING_KEYS.paypalClientId,
    label: "PayPal Client ID",
    type: "text" as const,
  },
  {
    key: SETTING_KEYS.paypalClientSecret,
    label: "PayPal Client Secret",
    type: "password" as const,
  },
  {
    key: SETTING_KEYS.donationCurrency,
    label: "Donation Currency",
    type: "text" as const,
  },
];

export const EMAIL_SETTING_FIELDS = [
  { key: SETTING_KEYS.smtpHost, label: "SMTP Host", type: "text" as const },
  { key: SETTING_KEYS.smtpPort, label: "SMTP Port", type: "text" as const },
  { key: SETTING_KEYS.smtpUser, label: "SMTP Username", type: "text" as const },
  {
    key: SETTING_KEYS.smtpPass,
    label: "SMTP Password",
    type: "password" as const,
  },
  {
    key: SETTING_KEYS.smtpFrom,
    label: "From Email Address",
    type: "email" as const,
  },
  {
    key: SETTING_KEYS.notificationEmail,
    label: "Notification Email",
    type: "email" as const,
  },
];

export type SettingsMap = Record<string, string>;

export type SettingsUpdater = (
  updater: SettingsMap | ((current: SettingsMap) => SettingsMap)
) => void;
