import { FLYER_COLORS, FLYER_HEIGHT, FLYER_WIDTH } from "@/lib/flyers/constants";
import type { SingleCategoryFlyerProps } from "@/lib/flyers/types";
import {
  FlyerArchHeader,
  FlyerCategoryBanner,
  FlyerCategoryIconRow,
  FlyerDoubleBorder,
  FlyerFooter,
  FlyerHeading,
  FlyerQrCodeFrame,
  FlyerScanLabel,
  FlyerSubtext,
  FlyerSupportLine,
} from "@/lib/flyers/shared";
import { ARCH_FRAME, GEOMETRIC_PATTERN_BG, MOSQUE_SILHOUETTE } from "@/lib/flyers/svg-assets";

const { navy } = FLYER_COLORS;

export function GoldFlyerTemplate({
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
      backgroundColor={navy}
      backgroundImage={GEOMETRIC_PATTERN_BG}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
        <FlyerArchHeader
          mosqueSrc={MOSQUE_SILHOUETTE}
          archSrc={ARCH_FRAME}
          logoDataUrl={logoDataUrl}
        />
        <FlyerHeading>{content.headline}</FlyerHeading>
        <FlyerSubtext>{content.subtext}</FlyerSubtext>

        <FlyerScanLabel>{content.scanLabel}</FlyerScanLabel>
        <FlyerCategoryBanner categoryName={content.categoryBanner} />
        <FlyerQrCodeFrame qrCodeDataUrl={qrCodeDataUrl} />
        <FlyerSupportLine>{content.supportLine}</FlyerSupportLine>

        <FlyerCategoryIconRow items={categoryIcons} variant="gold" />
        <FlyerFooter mosqueInfo={mosqueInfo} />
      </div>
    </FlyerDoubleBorder>
  );
}
