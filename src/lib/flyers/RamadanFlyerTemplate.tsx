import { FLYER_COLORS, FLYER_HEIGHT, FLYER_LAYOUT, FLYER_WIDTH } from "@/lib/flyers/constants";
import type { SingleCategoryFlyerProps } from "@/lib/flyers/types";
import {
  FlyerCategoryBanner,
  FlyerCategoryIconRow,
  FlyerDividerDiamond,
  FlyerDoubleBorder,
  FlyerFooter,
  FlyerHeading,
  FlyerProminentLogo,
  FlyerQrCodeFrame,
  FlyerScanLabel,
  FlyerSubtext,
  FlyerSupportLine,
  gold,
} from "@/lib/flyers/shared";
import {
  CRESCENT_MOON,
  LANTERN,
  MOSQUE_SILHOUETTE,
  ORNATE_PATTERN_PURPLE,
  STAR_SPARKLE,
} from "@/lib/flyers/svg-assets";

const { ramadanPurpleDark } = FLYER_COLORS;
const L = FLYER_LAYOUT;

export function RamadanFlyerTemplate({
  content,
  qrCodeDataUrl,
  mosqueInfo,
  logoDataUrl,
  categoryIcons,
}: SingleCategoryFlyerProps) {
  return (
    <FlyerDoubleBorder
      width={FLYER_WIDTH}
      height={FLYER_HEIGHT}
      backgroundColor={ramadanPurpleDark}
      backgroundImage={ORNATE_PATTERN_PURPLE}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
            padding: "0 20px",
            marginBottom: -12,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={CRESCENT_MOON} alt="" width={90} height={90} />
          <div style={{ display: "flex", flexDirection: "row", gap: 16, alignItems: "flex-start" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LANTERN} alt="" width={56} height={100} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LANTERN} alt="" width={48} height={86} style={{ marginTop: 20 }} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "row", gap: 24, marginBottom: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={STAR_SPARKLE} alt="" width={18} height={18} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={STAR_SPARKLE} alt="" width={14} height={14} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={STAR_SPARKLE} alt="" width={20} height={20} />
        </div>

        <FlyerProminentLogo logoDataUrl={logoDataUrl} fallbackSrc={MOSQUE_SILHOUETTE} />

        <p
          style={{
            margin: "0 0 6px",
            fontSize: L.ramadanTitleSize,
            fontWeight: 700,
            color: gold,
            fontFamily: "Poppins",
            fontStyle: "italic",
            letterSpacing: 2,
          }}
        >
          Ramadan Mubarak
        </p>

        <FlyerHeading size={L.ramadanHeadingSize}>{content.headline}</FlyerHeading>
        <FlyerSubtext>{content.subtext}</FlyerSubtext>

        <FlyerDividerDiamond />

        <FlyerScanLabel>{content.scanLabel}</FlyerScanLabel>
        <FlyerCategoryBanner categoryName={content.categoryBanner} />
        <FlyerQrCodeFrame qrCodeDataUrl={qrCodeDataUrl} />
        <FlyerSupportLine>{content.supportLine}</FlyerSupportLine>

        <FlyerCategoryIconRow items={categoryIcons} variant="ramadan" />
        <FlyerFooter mosqueInfo={mosqueInfo} />
      </div>
    </FlyerDoubleBorder>
  );
}
