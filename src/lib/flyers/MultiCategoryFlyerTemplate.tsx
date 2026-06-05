import { FLYER_COLORS, FLYER_LAYOUT, FLYER_MULTI_HEIGHT, FLYER_MULTI_WIDTH } from "@/lib/flyers/constants";
import type { FlyerCategoryPayload, MultiCategoryFlyerProps } from "@/lib/flyers/types";
import {
  FlyerArchHeader,
  FlyerDoubleBorder,
  FlyerFooter,
  FlyerHeading,
  FlyerQrCodeFrame,
  FlyerSubtext,
  gold,
  muted,
} from "@/lib/flyers/shared";
import { ARCH_FRAME, GEOMETRIC_PATTERN_BG, MOSQUE_SILHOUETTE } from "@/lib/flyers/svg-assets";

const { navy } = FLYER_COLORS;
const L = FLYER_LAYOUT;

function GridCell({ category }: { category: FlyerCategoryPayload }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: L.gridCellWidth,
        padding: "14px 16px",
        border: `2px solid rgba(212, 175, 55, 0.55)`,
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={category.iconSrc} alt="" width={L.gridIconSize} height={L.gridIconSize} />
      <p
        style={{
          margin: "8px 0 4px",
          fontSize: L.gridTitleSize,
          fontWeight: 700,
          color: gold,
          textAlign: "center",
          letterSpacing: 1.5,
          textTransform: "uppercase",
        }}
      >
        {category.name}
      </p>
      <p
        style={{
          margin: "0 0 10px",
          fontSize: L.gridDescriptionSize,
          color: muted,
          textAlign: "center",
          lineHeight: 1.4,
          minHeight: 32,
        }}
      >
        {category.description}
      </p>
      <FlyerQrCodeFrame
        qrCodeDataUrl={category.qrCodeDataUrl}
        size={L.qrMultiSize}
        compact
      />
    </div>
  );
}

export function MultiCategoryFlyerTemplate({
  content,
  categories,
  mosqueInfo,
  logoDataUrl,
}: MultiCategoryFlyerProps) {
  return (
    <FlyerDoubleBorder
      width={FLYER_MULTI_WIDTH}
      height={FLYER_MULTI_HEIGHT}
      backgroundColor={navy}
      backgroundImage={GEOMETRIC_PATTERN_BG}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
        <FlyerArchHeader
          mosqueSrc={MOSQUE_SILHOUETTE}
          archSrc={ARCH_FRAME}
          logoDataUrl={logoDataUrl}
        />
        <FlyerHeading size={32}>{content.headline}</FlyerHeading>
        <FlyerSubtext>{content.subtext}</FlyerSubtext>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: L.gridGap,
            marginTop: 24,
            width: "100%",
          }}
        >
          {categories.map((category) => (
            <GridCell key={category.slug} category={category} />
          ))}
        </div>

        <FlyerFooter mosqueInfo={mosqueInfo} />
      </div>
    </FlyerDoubleBorder>
  );
}
