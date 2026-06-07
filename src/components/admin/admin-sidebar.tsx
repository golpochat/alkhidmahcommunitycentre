"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { SessionUser } from "@/lib/auth";
import {
  BookOpen,
  Calendar,
  ClipboardList,
  Clock,
  Heart,
  History,
  Image,
  Info,
  LayoutDashboard,
  Mail,
  Menu,
  Monitor,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SITE_NAME, EDUCATION_NAV_LABEL, ADMIN_EDUCATION_PATH } from "@/lib/constants";
import {
  canManageClasses,
  canManageDonations,
  canManageEvents,
  canManageGallery,
  canManagePrayerTimes,
  canManageRegistrations,
  canWriteAdminContent,
} from "@/lib/rbac";
import { cn } from "@/lib/utils";

const navLinks = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    canAccess: () => true,
  },
  {
    href: "/admin/audit",
    label: "Content Audit",
    icon: History,
    canAccess: () => true,
  },
  {
    href: "/admin/events",
    label: "Events",
    icon: Calendar,
    canAccess: canManageEvents,
  },
  {
    href: "/admin/about",
    label: "About Page",
    icon: Info,
    canAccess: canWriteAdminContent,
  },
  {
    href: "/admin/gallery",
    label: "Gallery",
    icon: Image,
    canAccess: canManageGallery,
  },
  {
    href: "/admin/donations",
    label: "Donations",
    icon: Heart,
    canAccess: canManageDonations,
  },
  {
    href: ADMIN_EDUCATION_PATH,
    label: EDUCATION_NAV_LABEL,
    icon: BookOpen,
    canAccess: canManageClasses,
  },
  {
    href: "/admin/registrations",
    label: "Registrations",
    icon: ClipboardList,
    canAccess: canManageRegistrations,
  },
  {
    href: "/admin/contact",
    label: "Contact Messages",
    icon: Mail,
    canAccess: canManageRegistrations,
  },
  {
    href: "/admin/special-prayers",
    label: "Prayer Timetable",
    icon: Clock,
    canAccess: canManagePrayerTimes,
  },
  {
    href: "/admin/display",
    label: "TV Display",
    icon: Monitor,
    canAccess: canManagePrayerTimes,
  },
];

interface AdminSidebarProps {
  session: SessionUser;
}

function SidebarNav({
  pathname,
  session,
  onNavigate,
}: {
  pathname: string;
  session: SessionUser;
  onNavigate?: () => void;
}) {
  const links = navLinks.filter((link) => link.canAccess(session));

  return (
    <nav className="flex-1 space-y-1 p-4">
      {links.map((link) => {
        const isActive =
          link.href === "/admin"
            ? pathname === "/admin"
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

export function AdminSidebar({ session }: AdminSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between border-b border-border bg-card p-4 lg:hidden">
        <div>
          <p className="font-heading text-lg font-semibold text-gold">Admin Panel</p>
          <p className="text-xs text-muted-foreground">{SITE_NAME}</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="inline-flex size-9 items-center justify-center rounded-lg border border-gold text-gold transition-colors hover:bg-gold/10"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col p-0">
            <SheetHeader className="border-b border-border p-6 text-left">
              <SheetTitle className="font-heading text-gold">Admin Panel</SheetTitle>
            </SheetHeader>
            <SidebarNav
              pathname={pathname}
              session={session}
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      <aside className="admin-sidebar hidden lg:flex">
        <div className="border-b border-border p-6">
          <Link href="/admin" className="font-heading text-xl font-semibold text-gold">
            Admin Panel
          </Link>
          <p className="text-xs text-muted-foreground">{SITE_NAME}</p>
        </div>
        <SidebarNav pathname={pathname} session={session} />
      </aside>
    </>
  );
}
