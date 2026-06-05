import Image from "next/image";
import Link from "next/link";
import { LOGO_PATH } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SiteLogoProps {
  className?: string;
  variant?: "navbar" | "footer" | "compact";
  link?: boolean;
}

const footerSizeClasses = "h-12 w-auto md:h-14";

function isHeaderVariant(variant: SiteLogoProps["variant"]) {
  return variant === "navbar" || variant === "compact";
}

export function SiteLogo({
  className,
  variant = "navbar",
  link = true,
}: SiteLogoProps) {
  const headerLogo = isHeaderVariant(variant);

  const image = (
    <Image
      src={LOGO_PATH}
      alt="Al Khidmah Community Centre"
      width={420}
      height={150}
      className={cn(headerLogo ? "header-logo-image" : footerSizeClasses, className)}
      priority={variant === "navbar"}
    />
  );

  if (link) {
    return (
      <Link
        href="/"
        className={cn(
          headerLogo && "header-logo",
          "inline-flex shrink-0 items-center"
        )}
      >
        {image}
      </Link>
    );
  }

  if (headerLogo) {
    return <div className={cn("header-logo", className)}>{image}</div>;
  }

  return image;
}
