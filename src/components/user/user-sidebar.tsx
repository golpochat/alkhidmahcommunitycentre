"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Heart, LayoutDashboard, Menu, ClipboardList } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  { href: "/user", label: "Dashboard", icon: LayoutDashboard },
  { href: "/user/donations", label: "My Donations", icon: Heart },
  { href: "/user/registrations", label: "My Registrations", icon: ClipboardList },
];

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-1 p-4">
      {links.map((link) => {
        const isActive =
          link.href === "/user"
            ? pathname === "/user"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "admin-nav-link",
              isActive && "admin-nav-link-active"
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function UserSidebar({ siteName }: { siteName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between border-b border-border bg-card p-4 lg:hidden">
        <div>
          <p className="font-heading text-lg font-semibold text-gold">My Account</p>
          <p className="text-xs text-muted-foreground">{siteName}</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="inline-flex size-9 items-center justify-center rounded-lg border border-gold text-gold transition-colors hover:bg-gold/10">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col p-0">
            <SheetHeader className="border-b border-border p-6 text-left">
              <SheetTitle className="font-heading text-gold">My Account</SheetTitle>
            </SheetHeader>
            <SidebarNav pathname={pathname} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <aside className="admin-sidebar hidden lg:flex">
        <div className="border-b border-border p-6">
          <Link href="/user" className="font-heading text-xl font-semibold text-gold">
            My Account
          </Link>
          <p className="text-xs text-muted-foreground">{siteName}</p>
        </div>
        <SidebarNav pathname={pathname} />
      </aside>
    </>
  );
}
