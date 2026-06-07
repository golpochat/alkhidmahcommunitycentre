"use client";

import { createContext, useContext } from "react";
import { LOGO_PATH, SITE_NAME } from "@/lib/constants";

export interface PublicSiteBranding {
  siteName: string;
  logoPath: string;
}

const SiteBrandingContext = createContext<PublicSiteBranding | null>(null);

export function SiteBrandingProvider({
  value,
  children,
}: {
  value: PublicSiteBranding;
  children: React.ReactNode;
}) {
  return (
    <SiteBrandingContext.Provider value={value}>
      {children}
    </SiteBrandingContext.Provider>
  );
}

export function usePublicSiteBranding() {
  const context = useContext(SiteBrandingContext);
  return context ?? { siteName: SITE_NAME, logoPath: LOGO_PATH };
}
