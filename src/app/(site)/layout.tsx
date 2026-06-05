import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getFreshSession } from "@/lib/auth";
import { buildSiteAuthNav } from "@/lib/site-auth-nav";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getFreshSession();
  const authNav = buildSiteAuthNav(session);

  return (
    <div className="flex min-h-screen max-w-full flex-col overflow-x-hidden">
      <Navbar authNav={authNav} />
      <main className="flex-1 max-w-full overflow-x-hidden">{children}</main>
      <Footer />
    </div>
  );
}
