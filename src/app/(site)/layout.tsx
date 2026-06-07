import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PwaRegister } from "@/components/layout/pwa-register";
import { SiteStructuredData } from "@/components/layout/site-structured-data";
import { getFreshSession } from "@/lib/auth";
import { buildSiteAuthNav } from "@/lib/site-auth-nav";
import { getSiteBranding } from "@/lib/site-branding";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, branding] = await Promise.all([
    getFreshSession(),
    getSiteBranding(),
  ]);
  const authNav = buildSiteAuthNav(session);

  return (
    <div className="flex min-h-screen max-w-full flex-col overflow-x-hidden">
      <PwaRegister />
      <SiteStructuredData />
      <Navbar authNav={authNav} logoPath={branding.logoPath} />
      <main className="flex-1 max-w-full overflow-x-hidden">{children}</main>
      <Footer logoPath={branding.logoPath} />
    </div>
  );
}
