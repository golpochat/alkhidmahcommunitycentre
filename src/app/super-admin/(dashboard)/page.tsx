import Link from "next/link";
import { Settings, Shield, Users } from "lucide-react";
import { AccountTier } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboardPage() {
  let staffCount = 0;
  let memberCount = 0;

  try {
    if (process.env.DATABASE_URL) {
      staffCount = await db.user.count({
        where: { role: { tier: AccountTier.STAFF } },
      });
      memberCount = await db.user.count({
        where: { role: { tier: AccountTier.MEMBER } },
      });
    }
  } catch {
    // Database unavailable
  }

  const cards = [
    {
      title: "Staff & Users",
      description: "Invite staff, assign roles, and oversee member accounts.",
      href: "/super-admin/users",
      icon: Users,
      stat: `${staffCount} staff · ${memberCount} members`,
    },
    {
      title: "Roles & Permissions",
      description: "Create roles and control what each role can access.",
      href: "/super-admin/roles",
      icon: Shield,
      stat: "Access control",
    },
    {
      title: "Settings",
      description: "Manage site details, payments, email, and branding.",
      href: "/super-admin/settings",
      icon: Settings,
      stat: "Global config",
    },
  ];

  return (
    <div>
      <p className="mb-8 text-muted-foreground">
        Level 1 control centre. Manage staff accounts, roles, and site-wide settings from here.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="admin-stat-card h-full transition-colors hover:border-gold/40">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-heading text-lg">{card.title}</CardTitle>
                <card.icon className="h-5 w-5 text-gold" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{card.description}</p>
                <p className="mt-3 text-xs font-medium text-gold">{card.stat}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
