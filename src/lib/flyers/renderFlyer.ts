import "server-only";

import type React from "react";
import satori from "satori";
import type { DonationCategoryRecord } from "@/lib/donation-categories";
import { getCategoryIconSrc, buildGoldIconRow } from "@/lib/flyers/category-icons";
import { getFlyerMosqueInfo } from "@/lib/flyers/branding";
import {
  buildMultiCategoryContent,
  buildSingleCategoryContent,
} from "@/lib/flyers/content";
import {
  FLYER_HEIGHT,
  FLYER_MULTI_HEIGHT,
  FLYER_MULTI_WIDTH,
  FLYER_QR_SIZES,
  FLYER_WIDTH,
  type FlyerTheme,
} from "@/lib/flyers/constants";
import { loadFlyerFonts, loadFlyerLogoDataUrl } from "@/lib/flyers/fonts";
import { GoldFlyerTemplate } from "@/lib/flyers/GoldFlyerTemplate";
import { MultiCategoryFlyerTemplate } from "@/lib/flyers/MultiCategoryFlyerTemplate";
import { RamadanFlyerTemplate } from "@/lib/flyers/RamadanFlyerTemplate";
import { saveFlyerPng } from "@/lib/flyers/storage";
import type { FlyerCategoryPayload } from "@/lib/flyers/types";
import { generateQrDataUrl } from "@/lib/qr";

export interface GeneratedFlyerResult {
  success: true;
  filename: string;
  url: string;
  imageUrl: string;
  width: number;
  height: number;
}

async function renderElementToPng(
  element: React.ReactElement,
  width: number,
  height: number
) {
  const fonts = await loadFlyerFonts();
  const svg = await satori(element, { width, height, fonts });
  const sharp = (await import("sharp")).default;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function buildCategoryPayload(
  category: DonationCategoryRecord,
  qrSize: number
): Promise<FlyerCategoryPayload> {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description?.trim() ?? "",
    qrCodeDataUrl: await generateQrDataUrl(category.donationUrl, qrSize),
    iconSrc: getCategoryIconSrc(category.slug),
  };
}

export async function renderGoldFlyer(input: {
  content: ReturnType<typeof buildSingleCategoryContent>;
  qrCodeDataUrl: string;
  logoDataUrl: string | null;
  mosqueInfo: Awaited<ReturnType<typeof getFlyerMosqueInfo>>;
  categoryIcons: ReturnType<typeof buildGoldIconRow>;
}) {
  return renderElementToPng(
    GoldFlyerTemplate({
      content: input.content,
      qrCodeDataUrl: input.qrCodeDataUrl,
      mosqueInfo: input.mosqueInfo,
      logoDataUrl: input.logoDataUrl,
      categoryIcons: input.categoryIcons,
    }),
    FLYER_WIDTH,
    FLYER_HEIGHT
  );
}

export async function renderRamadanFlyer(input: {
  content: ReturnType<typeof buildSingleCategoryContent>;
  qrCodeDataUrl: string;
  logoDataUrl: string | null;
  mosqueInfo: Awaited<ReturnType<typeof getFlyerMosqueInfo>>;
  categoryIcons: ReturnType<typeof buildGoldIconRow>;
}) {
  return renderElementToPng(
    RamadanFlyerTemplate({
      content: input.content,
      qrCodeDataUrl: input.qrCodeDataUrl,
      mosqueInfo: input.mosqueInfo,
      logoDataUrl: input.logoDataUrl,
      categoryIcons: input.categoryIcons,
    }),
    FLYER_WIDTH,
    FLYER_HEIGHT
  );
}

export async function renderMultiCategoryFlyer(input: {
  content: ReturnType<typeof buildMultiCategoryContent>;
  categories: FlyerCategoryPayload[];
  logoDataUrl: string | null;
  mosqueInfo: Awaited<ReturnType<typeof getFlyerMosqueInfo>>;
}) {
  return renderElementToPng(
    MultiCategoryFlyerTemplate({
      content: input.content,
      categories: input.categories,
      mosqueInfo: input.mosqueInfo,
      logoDataUrl: input.logoDataUrl,
    }),
    FLYER_MULTI_WIDTH,
    FLYER_MULTI_HEIGHT
  );
}

/** End-to-end: render theme, save PNG, return public URL metadata. */
export async function generateFlyer(options: {
  theme: FlyerTheme;
  category?: DonationCategoryRecord;
  allCategories?: DonationCategoryRecord[];
}): Promise<GeneratedFlyerResult> {
  const [logoDataUrl, mosqueInfo] = await Promise.all([
    loadFlyerLogoDataUrl(),
    getFlyerMosqueInfo(),
  ]);

  const allCategories = options.allCategories ?? [];

  if (options.theme === "multi-category") {
    if (allCategories.length === 0) {
      throw new Error("No active donation categories found");
    }

    const payloads = await Promise.all(
      allCategories.map((category) =>
        buildCategoryPayload(category, FLYER_QR_SIZES.multiRender)
      )
    );

    const pngBuffer = await renderMultiCategoryFlyer({
      content: buildMultiCategoryContent(),
      categories: payloads,
      logoDataUrl,
      mosqueInfo,
    });

    const saved = await saveFlyerPng(pngBuffer, {
      theme: options.theme,
      categorySlug: "all",
      width: FLYER_MULTI_WIDTH,
      height: FLYER_MULTI_HEIGHT,
    });

    return { success: true, ...saved, imageUrl: saved.url };
  }

  const category = options.category;
  if (!category) {
    throw new Error("Category is required for this theme");
  }
  if (!category.donationUrl?.trim()) {
    throw new Error("Selected category is missing a donation URL");
  }

  const content = buildSingleCategoryContent(category, options.theme);
  const qrCodeDataUrl = await generateQrDataUrl(
    category.donationUrl,
    FLYER_QR_SIZES.singleRender
  );

  const categoryIcons = buildGoldIconRow(allCategories);

  const pngBuffer =
    options.theme === "ramadan"
      ? await renderRamadanFlyer({
          content,
          qrCodeDataUrl,
          logoDataUrl,
          mosqueInfo,
          categoryIcons,
        })
      : await renderGoldFlyer({
          content,
          qrCodeDataUrl,
          logoDataUrl,
          mosqueInfo,
          categoryIcons,
        });

  const saved = await saveFlyerPng(pngBuffer, {
    theme: options.theme,
    categorySlug: category.slug,
    width: FLYER_WIDTH,
    height: FLYER_HEIGHT,
  });

  return { success: true, ...saved, imageUrl: saved.url };
}
