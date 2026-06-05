import type { MosqueInfo } from "@/lib/mosqueConfig";

export type FlyerMosqueInfo = MosqueInfo;

export interface FlyerCategoryPayload {
  name: string;
  slug: string;
  description: string;
  qrCodeDataUrl: string;
  iconSrc: string;
}

export interface FlyerCategoryIconItem {
  slug: string;
  label: string;
  src: string;
}

export interface FlyerContent {
  headline: string;
  subtext: string;
  categoryBanner: string;
  supportLine: string;
  scanLabel: string;
}

export interface SingleCategoryFlyerProps {
  content: FlyerContent;
  qrCodeDataUrl: string;
  mosqueInfo: FlyerMosqueInfo;
  logoDataUrl: string | null;
  categoryIcons: FlyerCategoryIconItem[];
}

export interface MultiCategoryFlyerProps {
  content: FlyerContent;
  categories: FlyerCategoryPayload[];
  mosqueInfo: FlyerMosqueInfo;
  logoDataUrl: string | null;
}
