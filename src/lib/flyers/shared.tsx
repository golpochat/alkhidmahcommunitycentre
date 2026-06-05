import type { ReactNode } from "react";
import { FLYER_COLORS, FLYER_LAYOUT } from "@/lib/flyers/constants";
import type { FlyerCategoryIconItem, FlyerMosqueInfo } from "@/lib/flyers/types";

const { gold, white, muted, mutedSoft } = FLYER_COLORS;
const L = FLYER_LAYOUT;

export function FlyerDoubleBorder({
  children,
  backgroundImage,
  backgroundColor,
  width,
  height,
}: {
  children: ReactNode;
  backgroundImage?: string;
  backgroundColor: string;
  width: number;
  height: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width,
        height,
        backgroundColor,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: "80px 80px",
        backgroundRepeat: "repeat",
        padding: L.borderPadding,
        fontFamily: "Poppins",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          border: `3px solid ${gold}`,
          padding: L.innerBorderPadding,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            border: `1px solid ${gold}`,
            padding: L.contentPadding,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function FlyerArchHeader({
  mosqueSrc,
  archSrc,
  logoDataUrl,
}: {
  mosqueSrc: string;
  archSrc: string;
  logoDataUrl?: string | null;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        marginBottom: 8,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={archSrc}
        alt=""
        width={L.archWidth}
        height={L.archHeight}
        style={{ objectFit: "contain" }}
      />
      <div style={{ display: "flex", marginTop: L.archLogoOverlap, marginBottom: 8 }}>
        {logoDataUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={logoDataUrl}
            alt=""
            width={L.logoWidth}
            height={L.logoHeight}
            style={{ objectFit: "contain" }}
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={mosqueSrc}
            alt=""
            width={L.mosqueWidth}
            height={L.mosqueHeight}
            style={{ objectFit: "contain" }}
          />
        )}
      </div>
    </div>
  );
}

/** Large centred logo for themes without the gold arch header. */
export function FlyerProminentLogo({
  logoDataUrl,
  fallbackSrc,
}: {
  logoDataUrl?: string | null;
  fallbackSrc?: string;
}) {
  const src = logoDataUrl ?? fallbackSrc;
  if (!src) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
        margin: "8px 0 16px",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={L.logoWidth}
        height={L.logoHeight}
        style={{ objectFit: "contain" }}
      />
    </div>
  );
}

export function FlyerHeading({
  children,
  size = L.headingSize,
  color = gold,
}: {
  children: ReactNode;
  size?: number;
  color?: string;
}) {
  return (
    <p
      style={{
        margin: 0,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: L.headingLetterSpacing,
        textTransform: "uppercase",
        color,
        textAlign: "center",
        fontFamily: "Poppins",
        lineHeight: 1.2,
      }}
    >
      {children}
    </p>
  );
}

export function FlyerSubtext({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        margin: "14px 0 0",
        fontSize: L.subtextSize,
        color: white,
        textAlign: "center",
        lineHeight: 1.55,
        maxWidth: 760,
        fontWeight: 400,
      }}
    >
      {children}
    </p>
  );
}

export function FlyerCategoryBanner({ categoryName }: { categoryName: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        margin: "20px 0 24px",
        width: "100%",
      }}
    >
      <div style={{ width: L.categoryLineWidth, height: 2, background: gold }} />
      <p
        style={{
          margin: 0,
          fontSize: L.categoryBannerSize,
          fontWeight: 700,
          color: gold,
          letterSpacing: 3,
          textTransform: "uppercase",
          fontFamily: "Poppins",
        }}
      >
        — {categoryName.toUpperCase()} —
      </p>
      <div style={{ width: L.categoryLineWidth, height: 2, background: gold }} />
    </div>
  );
}

export function FlyerScanLabel({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        margin: "28px 0 0",
        fontSize: L.scanLabelSize,
        fontWeight: 600,
        letterSpacing: 4,
        textTransform: "uppercase",
        color: white,
        textAlign: "center",
      }}
    >
      {children}
    </p>
  );
}

export function FlyerQrCodeFrame({
  qrCodeDataUrl,
  size = L.qrSingleSize,
  compact = false,
}: {
  qrCodeDataUrl: string;
  size?: number;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          padding: compact ? 6 : L.qrGlowPadding,
          background: "rgba(212, 175, 55, 0.18)",
          borderRadius: compact ? 12 : L.qrGlowRadius,
        }}
      >
        <div
          style={{
            display: "flex",
            padding: compact ? 6 : L.qrInnerPadding,
            background: white,
            border: `${compact ? 3 : L.qrBorderWidth}px solid ${gold}`,
            borderRadius: compact ? 8 : 18,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCodeDataUrl} alt="QR" width={size} height={size} />
        </div>
      </div>
    </div>
  );
}

export function FlyerSupportLine({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        margin: "24px 0 0",
        fontSize: L.supportLineSize,
        color: muted,
        textAlign: "center",
        lineHeight: 1.55,
        maxWidth: 700,
      }}
    >
      {children}
    </p>
  );
}

export function FlyerCategoryIconRow({
  items,
  variant = "gold",
}: {
  items: FlyerCategoryIconItem[];
  variant?: "gold" | "ramadan";
}) {
  const itemWidth = Math.floor(L.iconRowMaxWidth / Math.max(items.length, 1));
  const labelColor = variant === "ramadan" ? gold : white;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "flex-start",
        marginTop: 28,
        width: "100%",
        maxWidth: L.iconRowMaxWidth,
      }}
    >
      {items.map((item, index) => (
        <div
          key={item.slug}
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: itemWidth,
              padding: "0 6px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.src} alt="" width={L.iconSize} height={L.iconSize} />
            <p
              style={{
                margin: "8px 0 0",
                fontSize: L.iconLabelSize,
                color: labelColor,
                textAlign: "center",
                fontWeight: 600,
                lineHeight: 1.3,
              }}
            >
              {item.label}
            </p>
          </div>
          {variant === "ramadan" && index < items.length - 1 ? (
            <div
              style={{
                width: 1,
                height: L.iconDividerHeight,
                background: "rgba(212,175,55,0.45)",
              }}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function FlyerDividerDiamond() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        margin: "20px 0",
        width: "100%",
      }}
    >
      <div style={{ flex: 1, height: 1, background: "rgba(212,175,55,0.5)" }} />
      <div
        style={{
          width: 10,
          height: 10,
          background: gold,
          transform: "rotate(45deg)",
        }}
      />
      <div style={{ flex: 1, height: 1, background: "rgba(212,175,55,0.5)" }} />
    </div>
  );
}

export function FlyerFooter({ mosqueInfo }: { mosqueInfo: FlyerMosqueInfo }) {
  const websiteLabel = mosqueInfo.website.replace(/^https?:\/\//, "");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "auto",
        paddingTop: 24,
        width: "100%",
      }}
    >
      <div
        style={{
          width: "80%",
          height: 1,
          background: "rgba(212,175,55,0.45)",
          marginBottom: 16,
        }}
      />
      <p
        style={{
          margin: 0,
          fontSize: L.footerNameSize,
          fontWeight: 700,
          color: gold,
          fontFamily: "Poppins",
          letterSpacing: 1,
        }}
      >
        {mosqueInfo.name}
      </p>
      <div
        style={{
          width: "70%",
          height: 1,
          background: "rgba(212,175,55,0.35)",
          margin: "14px 0",
        }}
      />
      <p style={{ margin: 0, fontSize: L.footerLineSize, color: white, textAlign: "center" }}>
        {mosqueInfo.address}
      </p>
      <div
        style={{
          width: "60%",
          height: 1,
          background: "rgba(212,175,55,0.25)",
          margin: "10px 0",
        }}
      />
      <p
        style={{
          margin: 0,
          fontSize: L.footerLineSize,
          color: mutedSoft,
          textAlign: "center",
        }}
      >
        Phone: {mosqueInfo.phone}
      </p>
      <div
        style={{
          width: "60%",
          height: 1,
          background: "rgba(212,175,55,0.25)",
          margin: "10px 0",
        }}
      />
      <p
        style={{
          margin: 0,
          fontSize: L.footerLineSize,
          color: mutedSoft,
          textAlign: "center",
        }}
      >
        Email: {mosqueInfo.email} · {websiteLabel}
      </p>
      <p
        style={{
          margin: "18px 0 0",
          fontSize: L.footerTaglineSize,
          color: gold,
          opacity: 0.9,
        }}
      >
        {mosqueInfo.tagline}
      </p>
    </div>
  );
}

export { gold, white, muted };
