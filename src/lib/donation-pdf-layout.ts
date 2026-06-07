import { format } from "date-fns";
import { PDFDocument, StandardFonts, rgb, type PDFPage } from "pdf-lib";
import type { DonationStatementBranding } from "@/lib/donation-statement-branding";

export const PDF_PAGE = { width: 595.28, height: 841.89 };
export const PDF_MARGIN = 48;
export const PDF_FOOTER_HEIGHT = 58;
export const LETTERHEAD_LOGO_CONTACT_GAP = 20;
export const LETTERHEAD_CONTACT_MIN_WIDTH = 280;
export const LETTERHEAD_LOGO_MAX_HEIGHT = 46;
/** Fixed logo width cap so portrait + landscape timetables render the same logo size. */
export const LETTERHEAD_TIMETABLE_LOGO_MAX_WIDTH = 150;
export const LETTERHEAD_TIMETABLE_CONTACT_MAX_WIDTH = 420;
export const BRAND_GREEN = rgb(15 / 255, 107 / 255, 74 / 255);
export const BRAND_GOLD = rgb(212 / 255, 175 / 255, 55 / 255);
export const MUTED = rgb(0.35, 0.35, 0.35);

/** Shared timetable PDF letterhead/title spacing (monthly + Ramadan). */
export const PDF_LETTERHEAD_FONT_SCALE = 1.1;
export const PDF_LETTERHEAD_LOGO_SCALE = 1.1;
export const PDF_SECTION_GAP = 8 * PDF_LETTERHEAD_FONT_SCALE;
export const PDF_TITLE_FONT_SIZE = 16 * PDF_LETTERHEAD_FONT_SCALE;

export function drawHorizontalRule(
  page: PDFPage,
  y: number,
  pageWidth: number = PDF_PAGE.width,
  margin: number = PDF_MARGIN,
) {
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 0.75,
    color: BRAND_GOLD,
  });
}

export async function embedStandardFonts(pdfDoc: PDFDocument) {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  return { font, fontBold };
}

/** pdf-lib standard fonts only support WinAnsi; strip diacritics and unsupported Unicode. */
export function toPdfSafeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\u0020-\u007E\u00A0-\u00FF]/g, "");
}

export type PdfFonts = Awaited<ReturnType<typeof embedStandardFonts>>;

export type LetterheadOptions = {
  pageWidth?: number;
  margin?: number;
  contactAlign?: "left" | "center";
  fontScale?: number;
  combineEmailAndWebsite?: boolean;
  compact?: boolean;
  donationQrPng?: Uint8Array | null;
  donationQrLabel?: string;
  ruleGap?: number;
  logoScale?: number;
  logoMaxWidth?: number;
  contactMaxWidth?: number;
  /** Reserve right-side width (e.g. match monthly donation QR column without drawing a QR). */
  contactRightReserve?: number;
  /** Keep Eircode and phone on one line (timetable letterheads). */
  combinePostcodeAndPhone?: boolean;
  /** Draw the gold rule under the letterhead block (timetables use title rule instead). */
  drawBottomRule?: boolean;
};

export type PdfTitleSectionOptions = {
  titleSize?: number;
  pageWidth: number;
  margin: number;
  sectionGap?: number;
  align?: "left" | "center";
  /** Draw a gold rule below the title (default for timetable PDFs). */
  drawBottomRule?: boolean;
};

export function getPdfFontVerticalMetrics(
  font: PdfFonts["font"],
  fontSize: number,
) {
  const height = font.heightAtSize(fontSize);
  return {
    ascent: height * 0.72,
    descent: height * 0.28,
  };
}

export function drawPdfTitleSection(
  page: PDFPage,
  title: string,
  y: number,
  fonts: PdfFonts,
  options: PdfTitleSectionOptions,
) {
  const { fontBold } = fonts;
  const sectionGap = options.sectionGap ?? PDF_SECTION_GAP;
  const titleSize = options.titleSize ?? PDF_TITLE_FONT_SIZE;
  const metrics = getPdfFontVerticalMetrics(fontBold, titleSize);
  const titleBaseline = y - metrics.ascent;
  const safeTitle = toPdfSafeText(title);

  let titleX = options.margin;
  if (options.align === "center") {
    titleX =
      (options.pageWidth - fontBold.widthOfTextAtSize(safeTitle, titleSize)) / 2;
  }

  page.drawText(safeTitle, {
    x: titleX,
    y: titleBaseline,
    size: titleSize,
    font: fontBold,
    color: BRAND_GREEN,
  });

  const drawBottomRule = options.drawBottomRule ?? true;
  const titleBottom = titleBaseline - metrics.descent;
  if (!drawBottomRule) {
    return titleBottom;
  }

  const ruleY = titleBottom - sectionGap;
  drawHorizontalRule(page, ruleY, options.pageWidth, options.margin);

  return ruleY - sectionGap;
}

export function buildTimetableLetterheadOptions(
  overrides: Partial<LetterheadOptions> = {},
): LetterheadOptions {
  const contactRightReserve =
    LETTERHEAD_DONATION_QR_SIZE * PDF_LETTERHEAD_FONT_SCALE +
    24 * PDF_LETTERHEAD_FONT_SCALE;

  return {
    contactAlign: "center",
    fontScale: PDF_LETTERHEAD_FONT_SCALE,
    combineEmailAndWebsite: true,
    compact: true,
    logoScale: PDF_LETTERHEAD_LOGO_SCALE,
    logoMaxWidth: LETTERHEAD_TIMETABLE_LOGO_MAX_WIDTH,
    contactMaxWidth: LETTERHEAD_TIMETABLE_CONTACT_MAX_WIDTH,
    contactRightReserve,
    combinePostcodeAndPhone: true,
    drawBottomRule: false,
    ruleGap: PDF_SECTION_GAP,
    ...overrides,
  };
}

const LETTERHEAD_DONATION_QR_SIZE = 52;

function splitPostcodeFromAddress(address: string): {
  addressWithoutPostcode: string;
  postcode: string | null;
} {
  const safe = toPdfSafeText(address.trim());
  const match = safe.match(/^(.*,\s*)(D\d{2}\s+[A-Z0-9]{4})\s*$/i);
  if (!match) {
    return { addressWithoutPostcode: safe, postcode: null };
  }

  return {
    addressWithoutPostcode: match[1].replace(/,\s*$/, ""),
    postcode: match[2].replace(/\s+/g, " "),
  };
}

function buildLetterheadContactLines(
  branding: DonationStatementBranding,
  options: LetterheadOptions,
): string[] {
  const phoneLine = `Tel: ${branding.phone}`;
  const emailLine = options.combineEmailAndWebsite
    ? `Email: ${branding.email} · ${branding.website}`
    : null;
  const trailingLines = emailLine
    ? [emailLine]
    : [`Email: ${branding.email}`, branding.website];

  if (!options.combinePostcodeAndPhone) {
    return [branding.address, phoneLine, ...trailingLines].filter(
      (line): line is string => Boolean(line),
    );
  }

  const { addressWithoutPostcode, postcode } = splitPostcodeFromAddress(
    branding.address,
  );

  if (!postcode) {
    return [branding.address, phoneLine, ...trailingLines].filter(
      (line): line is string => Boolean(line),
    );
  }

  return [
    addressWithoutPostcode,
    `${postcode} · ${phoneLine}`,
    ...trailingLines,
  ].filter((line): line is string => Boolean(line));
}

function drawZoneCenteredLine(
  page: PDFPage,
  text: string,
  y: number,
  zoneLeft: number,
  zoneWidth: number,
  font: PdfFonts["font"],
  size: number,
  color: ReturnType<typeof rgb>,
) {
  const safeText = toPdfSafeText(text);
  const textWidth = font.widthOfTextAtSize(safeText, size);
  page.drawText(safeText, {
    x: zoneLeft + Math.max(0, (zoneWidth - textWidth) / 2),
    y,
    size,
    font,
    color,
  });
}

export async function drawLetterhead(
  pdfDoc: PDFDocument,
  page: PDFPage,
  yStart: number,
  branding: DonationStatementBranding,
  fonts: PdfFonts,
  logoPng?: Uint8Array | null,
  options: LetterheadOptions = {},
) {
  const pageWidth = options.pageWidth ?? PDF_PAGE.width;
  const margin = options.margin ?? PDF_MARGIN;
  const contactAlign = options.contactAlign ?? "left";
  const fontScale = options.fontScale ?? 1;
  const logoScale = options.logoScale ?? 1;
  const compact = options.compact ?? false;
  const { font, fontBold } = fonts;
  const siteNameSize = 14 * fontScale;
  const contactSize = 9 * fontScale;
  const siteNameLineHeight = (compact ? 16 : 18) * fontScale;
  const contactLineHeight = (compact ? 10 : 12) * fontScale;
  let y = yStart;
  const ruleGap = options.ruleGap ?? (compact ? 8 : 10);
  const contentWidth = pageWidth - margin * 2;
  const donationQrSize = LETTERHEAD_DONATION_QR_SIZE * fontScale;
  const donationQrLabel = options.donationQrLabel ?? "Donate now";
  const donationQrLabelSize = contactSize;
  const hasDonationQr = Boolean(options.donationQrPng);
  const donationQrReserve = hasDonationQr
    ? donationQrSize + 24 * fontScale
    : 0;
  const rightColumnReserve = Math.max(
    donationQrReserve,
    options.contactRightReserve ?? 0,
  );
  const maxLogoWidth =
    options.logoMaxWidth ??
    (contactAlign === "center"
      ? Math.max(80, contentWidth * 0.2)
      : Math.max(
          80,
          contentWidth -
            LETTERHEAD_CONTACT_MIN_WIDTH -
            LETTERHEAD_LOGO_CONTACT_GAP,
        ));
  let contactStartX = margin;
  let logoBottomY = yStart;
  let logoWidth = 0;

  if (logoPng) {
    const logoImage = await pdfDoc.embedPng(logoPng);
    const logoDims = logoImage.scale(0.35);
    const logoMaxHeight = LETTERHEAD_LOGO_MAX_HEIGHT * logoScale;
    logoWidth = Math.min(
      (logoDims.width / logoDims.height) * logoMaxHeight,
      logoDims.width,
      maxLogoWidth,
    );
    let logoHeight = (logoDims.height / logoDims.width) * logoWidth;
    logoHeight = Math.min(logoHeight, logoMaxHeight);

    page.drawImage(logoImage, {
      x: margin,
      y: y - logoHeight + 8,
      width: logoWidth,
      height: logoHeight,
    });

    logoBottomY = y - logoHeight + 8;
    contactStartX = margin + logoWidth + LETTERHEAD_LOGO_CONTACT_GAP;
  }

  const contactZoneLeft =
    logoWidth > 0 ? margin + logoWidth + LETTERHEAD_LOGO_CONTACT_GAP : margin;
  const contactZoneWidth = Math.max(
    0,
    pageWidth - margin - rightColumnReserve - contactZoneLeft,
  );

  const contactMaxWidth =
    contactAlign === "center"
      ? Math.min(
          options.contactMaxWidth ?? 420,
          contactZoneWidth,
        )
      : pageWidth - contactStartX - margin - rightColumnReserve;

  const drawContactLine = (
    line: string,
    lineY: number,
    lineFont: PdfFonts["font"],
    lineSize: number,
    lineColor: ReturnType<typeof rgb>,
    bold = false,
  ) => {
    const contactFont = bold ? fontBold : lineFont;
    if (contactAlign === "center") {
      drawZoneCenteredLine(
        page,
        line,
        lineY,
        contactZoneLeft,
        contactZoneWidth,
        contactFont,
        lineSize,
        lineColor,
      );
      return;
    }

    page.drawText(line, {
      x: contactStartX,
      y: lineY,
      size: lineSize,
      font: contactFont,
      color: lineColor,
    });
  };

  const siteName = toPdfSafeText(branding.siteName);
  drawContactLine(siteName, y, fontBold, siteNameSize, BRAND_GREEN, true);
  y -= siteNameLineHeight;

  const contactLines = buildLetterheadContactLines(branding, options);

  for (const line of contactLines) {
    const wrapped = wrapText(
      toPdfSafeText(line),
      font,
      contactSize,
      contactMaxWidth,
    );
    for (const wrappedLine of wrapped) {
      drawContactLine(wrappedLine, y, font, contactSize, MUTED);
      y -= contactLineHeight;
    }
  }

  let qrBottomY = yStart;
  if (hasDonationQr && options.donationQrPng) {
    const qrX = pageWidth - margin - donationQrSize;
    const qrY = yStart - donationQrSize + 8;
    const qrImage = await pdfDoc.embedPng(options.donationQrPng);

    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: donationQrSize,
      height: donationQrSize,
    });

    const label = toPdfSafeText(donationQrLabel);
    const labelWidth = fontBold.widthOfTextAtSize(label, donationQrLabelSize);
    const labelY = qrY - 6 - donationQrLabelSize;
    page.drawText(label, {
      x: qrX + (donationQrSize - labelWidth) / 2,
      y: labelY,
      size: donationQrLabelSize,
      font: fontBold,
      color: BRAND_GREEN,
    });

    qrBottomY = labelY - donationQrLabelSize;
  }

  y = Math.min(y, logoBottomY, qrBottomY);
  if (options.drawBottomRule !== false) {
    y -= ruleGap;
    drawHorizontalRule(page, y, pageWidth, margin);
  } else {
    y -= ruleGap;
  }

  return y - ruleGap;
}

export function wrapText(
  text: string,
  font: PdfFonts["font"],
  size: number,
  maxWidth: number,
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
      }
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [text];
}

export function drawPageFooters(
  pdfDoc: PDFDocument,
  branding: DonationStatementBranding,
  printedAt: string,
  fonts: PdfFonts,
) {
  const { font, fontBold } = fonts;
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  pages.forEach((footerPage, index) => {
    const { width: pageWidth } = footerPage.getSize();
    const contentWidth = pageWidth - PDF_MARGIN * 2;
    const footerTop = PDF_MARGIN + 38;
    drawHorizontalRule(footerPage, footerTop, pageWidth);

    footerPage.drawText(
      `Registered charity number: ${branding.charityNumber}`,
      {
        x: PDF_MARGIN,
        y: footerTop - 16,
        size: 8,
        font: fontBold,
        color: BRAND_GREEN,
      },
    );

    const addressLines = wrapText(
      `${branding.siteName} · ${branding.address}`,
      font,
      7.5,
      contentWidth,
    );
    let footerY = footerTop - 28;
    for (const line of addressLines) {
      footerPage.drawText(line, {
        x: PDF_MARGIN,
        y: footerY,
        size: 7.5,
        font,
        color: MUTED,
      });
      footerY -= 10;
    }

    footerPage.drawText(
      `Tel: ${branding.phone} · Email: ${branding.email} · ${branding.website}`,
      {
        x: PDF_MARGIN,
        y: footerTop - 40,
        size: 7.5,
        font,
        color: MUTED,
        maxWidth: contentWidth,
      },
    );

    const pageLabel = `Page ${index + 1} of ${totalPages}`;
    const pageLabelWidth = font.widthOfTextAtSize(pageLabel, 8);
    footerPage.drawText(pageLabel, {
      x: pageWidth - PDF_MARGIN - pageLabelWidth,
      y: footerTop - 16,
      size: 8,
      font,
      color: MUTED,
    });

    const printedLabel = `Printed: ${printedAt}`;
    const printedWidth = font.widthOfTextAtSize(printedLabel, 8);
    footerPage.drawText(printedLabel, {
      x: pageWidth - PDF_MARGIN - printedWidth,
      y: footerTop - 28,
      size: 8,
      font,
      color: MUTED,
    });
  });
}

export function formatPrintedAt(date = new Date()) {
  return format(date, "dd MMM yyyy 'at' HH:mm");
}

export function drawDonationStatementFooters(
  pdfDoc: PDFDocument,
  branding: DonationStatementBranding,
  printedAt: string,
  fonts: PdfFonts,
  buildPrimaryLine: (branding: DonationStatementBranding) => string,
  buildSecondaryLine: (pageNumber: number, totalPages: number) => string,
) {
  const { font } = fonts;
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;
  const footerFontSize = 7;
  const lineHeight = 9;

  pages.forEach((footerPage, index) => {
    const { width: pageWidth } = footerPage.getSize();
    const contentWidth = pageWidth - PDF_MARGIN * 2;
    const primaryLine = toPdfSafeText(buildPrimaryLine(branding));
    const secondaryLine = toPdfSafeText(
      buildSecondaryLine(index + 1, totalPages),
    );
    const primaryLines = wrapText(primaryLine, font, footerFontSize, contentWidth);
    const secondaryWidth = font.widthOfTextAtSize(secondaryLine, footerFontSize);
    const secondaryY = PDF_MARGIN + 10;
    const ruleY =
      secondaryY +
      lineHeight +
      6 +
      primaryLines.length * lineHeight +
      4;

    drawHorizontalRule(footerPage, ruleY, pageWidth);

    let primaryY = ruleY - 12;
    for (const line of primaryLines) {
      const lineWidth = font.widthOfTextAtSize(line, footerFontSize);
      footerPage.drawText(line, {
        x: Math.max(PDF_MARGIN, (pageWidth - lineWidth) / 2),
        y: primaryY,
        size: footerFontSize,
        font,
        color: MUTED,
      });
      primaryY -= lineHeight;
    }

    footerPage.drawText(secondaryLine, {
      x: Math.max(PDF_MARGIN, (pageWidth - secondaryWidth) / 2),
      y: secondaryY,
      size: footerFontSize,
      font,
      color: MUTED,
    });
  });
}
