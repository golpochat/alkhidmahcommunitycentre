export const FLYER_COLORS = {
  gold: "#D4AF37",
  goldLight: "#E8C96A",
  goldDim: "#B8942E",
  navy: "#0A1A2F",
  navyLight: "#122640",
  navyPattern: "#132743",
  white: "#FFFFFF",
  muted: "#D1D9E6",
  mutedSoft: "#A8B4C7",
  ramadanPurple: "#2D1B4E",
  ramadanPurpleDark: "#1A0F30",
  ramadanPurpleMid: "#3D2568",
  ramadanAccent: "#5A3488",
} as const;

export const FLYER_THEMES = ["gold", "ramadan", "multi-category"] as const;

export type FlyerTheme = (typeof FLYER_THEMES)[number];

export const FLYER_THEME_LABELS: Record<FlyerTheme, string> = {
  gold: "Default Gold Theme",
  ramadan: "Ramadan Theme",
  "multi-category": "Multi-Category 2×3 Grid",
};

/** Single-category portrait (1080×1620). */
export const FLYER_WIDTH = 1080;
export const FLYER_HEIGHT = 1620;

/** Multi-category: 2 columns × 3 rows. */
export const FLYER_MULTI_WIDTH = 1080;
export const FLYER_MULTI_HEIGHT = 1920;

/** Shared layout tokens — single source for sizing across all templates. */
export const FLYER_LAYOUT = {
  borderPadding: 22,
  innerBorderPadding: 10,
  contentPadding: "28px 32px",
  archWidth: 860,
  archHeight: 260,
  mosqueWidth: 360,
  mosqueHeight: 170,
  logoWidth: 420,
  logoHeight: 200,
  archLogoOverlap: -210,
  headingSize: 36,
  headingLetterSpacing: 4,
  subtextSize: 17,
  scanLabelSize: 15,
  categoryBannerSize: 44,
  categoryLineWidth: 100,
  qrSingleSize: 248,
  qrMultiSize: 112,
  qrBorderWidth: 5,
  qrInnerPadding: 14,
  qrGlowPadding: "20px 28px",
  qrGlowRadius: 24,
  supportLineSize: 16,
  iconSize: 80,
  iconLabelSize: 15,
  iconRowMaxWidth: 960,
  iconDividerHeight: 88,
  footerNameSize: 30,
  footerLineSize: 15,
  footerTaglineSize: 12,
  gridCellWidth: 460,
  gridGap: 14,
  gridIconSize: 64,
  gridTitleSize: 15,
  gridDescriptionSize: 11,
  ramadanTitleSize: 52,
  ramadanHeadingSize: 34,
} as const;

export const FLYER_QR_SIZES = {
  singleRender: 320,
  multiRender: 240,
} as const;
