export const SITE_NAME = "Al Khidmah Community Centre";
export const SITE_DESCRIPTION =
  "Serving the Muslim community of Clondalkin with prayer, education, and community support.";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://alkhidmah.ie";

export const LOGO_PATH = "/logo/logo.png";
export const LOGO_SVG_PATH = "/logo/logo.svg";
export const FAVICON_PATH = "/favicon.png";
export const FAVICON_HREF = "/favicon.png?v=8";

export const CONTACT = {
  address: "Unit 4, Monastery Road, Clondalkin, Dublin 22, D22 YX82",
  phone: "+353 1 457 8900",
  email: "info@alkhidmahmosque.ie",
  whatsapp: "+353851234567",
  charityNumber: "CHY 22345",
};

export const SOCIAL_LINKS = {
  facebook: "https://facebook.com/alkhidmahmosque",
  instagram: "https://instagram.com/alkhidmahmosque",
  youtube: "https://youtube.com/@alkhidmahmosque",
} as const;

export const EDUCATION_NAV_LABEL = "Education";
export const EDUCATION_PATH = "/education";
export const EDUCATION_API_PATH = "/api/education";
export const ADMIN_EDUCATION_PATH = "/admin/education";

export const DISPLAY_ADMIN_NAV_LABEL = "Screen & Announcements";
export const DISPLAY_ADMIN_PATH = "/admin/display";

/** @deprecated Use About CMS settings — visibility controlled in admin */
export const ABOUT_PAGE_VISIBILITY = {
  values: false,
  committee: false,
} as const;

export const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: EDUCATION_PATH, label: EDUCATION_NAV_LABEL },
  { href: "/events", label: "Events" },
  { href: "/gallery", label: "Gallery" },
  { href: "/donations", label: "Donations" },
  { href: "/contact", label: "Contact" },
] as const;

export const CLONDLAKIN_COORDS = {
  latitude: 53.3217,
  longitude: -6.4064,
};

/** Display order for donation categories (dropdowns, flyers, public pages). */
export const DONATION_CATEGORY_ORDER = [
  "sadaqah",
  "fitrah",
  "mosque-development",
  "ramadan",
  "dawah",
  "zakah",
] as const;

export const DONATION_CATEGORIES = [
  {
    id: "sadaqah",
    title: "Sadaqah",
    description:
      "Voluntary charity that brings barakah and supports ongoing mosque services.",
  },
  {
    id: "fitrah",
    title: "Fitrah",
    description:
      "Eid al-Fitr charity due before Eid prayer to support the less fortunate.",
  },
  {
    id: "mosque-development",
    title: "Mosque Development",
    description:
      "Help maintain and expand our facilities to serve the growing community.",
  },
  {
    id: "ramadan",
    title: "Ramadan",
    description:
      "Support iftar programmes, taraweeh, and Ramadan community initiatives.",
  },
  {
    id: "dawah",
    title: "Dawah",
    description:
      "Fund outreach, literature, and educational programmes for new Muslims.",
  },
  {
    id: "zakah",
    title: "Zakah",
    description:
      "Fulfill your obligatory charity and support those in need within our community.",
  },
] as const;

export const EVENT_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "community", label: "Community" },
  { value: "youth", label: "Youth" },
  { value: "sisters", label: "Sisters" },
  { value: "ramadan", label: "Ramadan" },
] as const;
