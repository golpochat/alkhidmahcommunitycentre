"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SiteLogo } from "@/components/layout/site-logo";
import { NAV_ITEMS } from "@/lib/constants";
import type { SiteAuthNav } from "@/lib/site-auth-nav";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const NAV_LINK_ITEMS = NAV_ITEMS.filter((item) => item.href !== "/donations");

interface NavbarProps {
  authNav: SiteAuthNav;
  logoPath?: string;
}

function NavDonateButton({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <ButtonLink
      href="/donations"
      className={cn("btn-gold navbar-donate-link", className)}
      onClick={onNavigate}
    >
      Donate
    </ButtonLink>
  );
}

export function Navbar({ authNav, logoPath }: NavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const donationsActive = pathname.startsWith("/donations");

  function renderDesktopNavItem(item: (typeof NAV_LINK_ITEMS)[number]) {
    const link = (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-gold",
          isActive(item.href) ? "text-gold" : "text-muted-foreground"
        )}
      >
        {item.label}
      </Link>
    );

    if (item.href === "/gallery") {
      return [
        link,
        <NavDonateButton
          key="donate"
          className={cn(donationsActive && "ring-2 ring-gold/40")}
        />,
      ];
    }

    return [link];
  }

  function renderMobileNavItem(item: (typeof NAV_LINK_ITEMS)[number]) {
    const link = (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setOpen(false)}
        className={cn(
          "mobile-nav-link",
          isActive(item.href) && "mobile-nav-link-active"
        )}
      >
        {item.label}
      </Link>
    );

    if (item.href === "/gallery") {
      return [
        link,
        <NavDonateButton
          key="donate"
          className={cn(
            "w-full",
            donationsActive && "ring-2 ring-gold/40"
          )}
          onNavigate={() => setOpen(false)}
        />,
      ];
    }

    return [link];
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="section-container flex min-h-[106px] items-center justify-between md:min-h-[7.5rem]">
        <SiteLogo variant="navbar" logoPath={logoPath} />

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINK_ITEMS.flatMap((item) => renderDesktopNavItem(item))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {authNav.isAuthenticated ? (
            <ButtonLink
              href={authNav.dashboardHref}
              variant="outline"
              className="navbar-auth-link hidden border-gold/40 text-gold sm:inline-flex"
            >
              Dashboard
            </ButtonLink>
          ) : (
            <>
              <ButtonLink
                href="/login"
                variant="outline"
                className="navbar-auth-link hidden border-gold/40 text-gold sm:inline-flex"
              >
                Sign In
              </ButtonLink>
              <ButtonLink
                href="/register"
                variant="outline"
                className="navbar-auth-link hidden border-gold/40 text-gold sm:inline-flex"
              >
                Sign Up
              </ButtonLink>
            </>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "lg:hidden"
              )}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-80" showCloseButton={false}>
              <div className="flex flex-col gap-6 pt-8">
                <div className="flex items-center justify-between">
                  <SiteLogo variant="compact" link={false} logoPath={logoPath} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setOpen(false)}
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <nav className="flex flex-col gap-2">
                  {NAV_LINK_ITEMS.flatMap((item) => renderMobileNavItem(item))}
                </nav>
                <div className="flex flex-col gap-2">
                  {authNav.isAuthenticated ? (
                    <ButtonLink
                      href={authNav.dashboardHref}
                      variant="outline"
                      className="w-full border-gold/40 text-gold"
                      onClick={() => setOpen(false)}
                    >
                      Dashboard
                    </ButtonLink>
                  ) : (
                    <>
                      <ButtonLink
                        href="/login"
                        variant="outline"
                        className="w-full border-gold/40 text-gold"
                        onClick={() => setOpen(false)}
                      >
                        Sign In
                      </ButtonLink>
                      <ButtonLink
                        href="/register"
                        variant="outline"
                        className="w-full border-gold/40 text-gold"
                        onClick={() => setOpen(false)}
                      >
                        Sign Up
                      </ButtonLink>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
