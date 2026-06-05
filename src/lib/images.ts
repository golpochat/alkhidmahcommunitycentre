/** Local Islamic imagery served from /public/images */
export const LOGO_PATH = "/logo/logo.png";

export const IMAGES = {
  hero: "/images/hero/masjid-hero.jpg",
  masjidInterior: "/images/gallery/default.jpg",
  masjidExterior: "/images/hero/masjid-hero.jpg",
  quranRecitation: "/images/classes/quran-class.jpg",
  calligraphy: "/images/classes/arabic-class.jpg",
  communityGathering: "/images/events/community.jpg",
  ramadan: "/images/events/ramadan.jpg",
  eid: "/images/events/eid.jpg",
  charity: "/images/gallery/charity.jpg",
  youth: "/images/events/youth.jpg",
  education: "/images/classes/quran-class.jpg",
  fundraising: "/images/events/fundraising.jpg",
  outreach: "/images/heroes/donations.jpg",
  galleryDefault: "/images/gallery/default.jpg",

  classes: {
    quran: "/images/classes/quran-class.jpg",
    adultQuran: "/images/classes/adult-quran.jpg",
    arabic: "/images/classes/arabic-class.jpg",
  },

  events: {
    community: "/images/events/community.jpg",
    tafseer: "/images/events/tafseer.jpg",
    openDay: "/images/events/open-day.jpg",
    iftar: "/images/events/iftar.jpg",
    ramadan: "/images/events/ramadan.jpg",
    youth: "/images/events/youth.jpg",
    sisters: "/images/events/sisters.jpg",
    eid: "/images/events/eid.jpg",
    fundraising: "/images/events/fundraising.jpg",
  },

  gallery: {
    jumuah: "/images/gallery/jumuah.jpg",
    ramadan: "/images/gallery/ramadan.jpg",
    eid: "/images/gallery/eid.jpg",
    prayer: "/images/gallery/prayer-evening.jpg",
    youth: "/images/gallery/youth.jpg",
    quran: "/images/gallery/quran.jpg",
    charity: "/images/gallery/charity.jpg",
    community: "/images/gallery/community.jpg",
    default: "/images/gallery/default.jpg",
  },

  heroes: {
    home: "/images/hero/masjid-hero.jpg",
    about: "/images/heroes/about.jpg",
    classes: "/images/heroes/classes.jpg",
    events: "/images/heroes/events.jpg",
    gallery: "/images/heroes/gallery.jpg",
    donations: "/images/heroes/donations.jpg",
    contact: "/images/heroes/contact.jpg",
  },
} as const;

const CLASS_IMAGE_MAP: Record<string, string> = {
  "childrens-quran-classes": IMAGES.classes.quran,
  "adult-quran-classes": IMAGES.classes.adultQuran,
  "arabic-language-beginners": IMAGES.classes.arabic,
};

export function getClassImage(slug: string) {
  return CLASS_IMAGE_MAP[slug] ?? IMAGES.classes.quran;
}

const EVENT_SLUG_IMAGES: Record<string, string> = {
  "weekly-tafseer-circle": IMAGES.events.tafseer,
  "mosque-open-day": IMAGES.events.openDay,
  "community-iftar-gathering": IMAGES.events.iftar,
  "youth-leadership-workshop": IMAGES.events.youth,
  "sisters-halaqah": IMAGES.events.sisters,
};

const EVENT_CATEGORY_IMAGES: Record<string, string> = {
  community: IMAGES.events.community,
  ramadan: IMAGES.events.ramadan,
  youth: IMAGES.events.youth,
  sisters: IMAGES.events.sisters,
  adult: IMAGES.events.community,
  others: IMAGES.events.community,
  lecture: IMAGES.events.tafseer,
  fundraising: IMAGES.events.fundraising,
  eid: IMAGES.events.eid,
};

export function getEventCardImage(slug: string, category?: string | null) {
  if (EVENT_SLUG_IMAGES[slug]) return EVENT_SLUG_IMAGES[slug];
  if (category && EVENT_CATEGORY_IMAGES[category]) {
    return EVENT_CATEGORY_IMAGES[category];
  }
  return IMAGES.events.community;
}

export function getEventCategoryImage(category?: string | null) {
  if (!category) return IMAGES.events.community;
  return EVENT_CATEGORY_IMAGES[category] ?? IMAGES.events.community;
}

const GALLERY_CATEGORY_IMAGES: Record<string, string> = {
  community: IMAGES.gallery.community,
  ramadan: IMAGES.gallery.ramadan,
  eid: IMAGES.gallery.eid,
  classes: IMAGES.gallery.quran,
  youth: IMAGES.gallery.youth,
};

const GALLERY_TITLE_IMAGES: Record<string, string> = {
  "Jumuah Congregation": IMAGES.gallery.jumuah,
  "Ramadan Programme": IMAGES.gallery.ramadan,
  "Ramadan Night Programme": IMAGES.gallery.ramadan,
  "Ramadan Iftar": IMAGES.events.iftar,
  "Qur'an Recitation": IMAGES.gallery.quran,
  "Children's Quran Class": IMAGES.gallery.quran,
  "Eid Celebration": IMAGES.gallery.eid,
  "Youth Programme": IMAGES.gallery.youth,
  "Youth Workshop": IMAGES.gallery.youth,
  "Community Gathering": IMAGES.gallery.community,
  "Evening Prayer": IMAGES.gallery.prayer,
  "Charity Drive": IMAGES.gallery.charity,
};

export function getGalleryCategoryImage(category?: string | null) {
  if (!category) return IMAGES.gallery.default;
  return GALLERY_CATEGORY_IMAGES[category] ?? IMAGES.gallery.default;
}

export function getGalleryImageByTitle(
  title?: string | null,
  category?: string | null,
) {
  if (title && GALLERY_TITLE_IMAGES[title]) {
    return GALLERY_TITLE_IMAGES[title];
  }
  return getGalleryCategoryImage(category);
}

function isRemoteImage(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

export function resolveGalleryImageUrl(
  imageUrl: string | null | undefined,
  category?: string | null,
  title?: string | null,
) {
  if (title && GALLERY_TITLE_IMAGES[title]) {
    return GALLERY_TITLE_IMAGES[title];
  }
  if (!imageUrl || isRemoteImage(imageUrl)) {
    return getGalleryCategoryImage(category);
  }
  return imageUrl;
}

export function resolveEventImageUrl(
  imageUrl: string | null | undefined,
  category?: string | null,
  slug?: string | null,
) {
  if (slug) return getEventCardImage(slug, category);
  if (!imageUrl || isRemoteImage(imageUrl)) {
    return getEventCategoryImage(category);
  }
  return imageUrl;
}

export const GALLERY_SEED_IMAGES = [
  {
    title: "Jumuah Congregation",
    category: "community",
    image: IMAGES.gallery.jumuah,
  },
  {
    title: "Ramadan Programme",
    category: "ramadan",
    image: IMAGES.gallery.ramadan,
  },
  {
    title: "Qur'an Recitation",
    category: "classes",
    image: IMAGES.gallery.quran,
  },
  { title: "Eid Celebration", category: "eid", image: IMAGES.gallery.eid },
  { title: "Youth Programme", category: "youth", image: IMAGES.gallery.youth },
  {
    title: "Community Gathering",
    category: "community",
    image: IMAGES.gallery.community,
  },
  {
    title: "Evening Prayer",
    category: "community",
    image: IMAGES.gallery.prayer,
  },
  {
    title: "Charity Drive",
    category: "community",
    image: IMAGES.gallery.charity,
  },
] as const;
