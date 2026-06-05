import { format } from "date-fns";
import { Calendar, ClipboardList, Heart, Image } from "lucide-react";
import { AdminDashboardCharts } from "@/components/admin/admin-dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardAnalytics } from "@/lib/admin-analytics";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let analytics = {
    stats: {
      totalDonations: 0,
      monthDonations: 0,
      monthDonationTotal: 0,
      allTimeDonationTotal: 0,
      upcomingEvents: 0,
      newRegistrations: 0,
      galleryImages: 0,
    },
    donationTrend: [] as Awaited<ReturnType<typeof getDashboardAnalytics>>["donationTrend"],
    registrationsByClass: [] as Awaited<
      ReturnType<typeof getDashboardAnalytics>
    >["registrationsByClass"],
    eventsByCategory: [] as Awaited<
      ReturnType<typeof getDashboardAnalytics>
    >["eventsByCategory"],
  };

  let recentEvents: { title: string; startAt: Date }[] = [];
  let recentDonations: {
    donorName: string | null;
    amount: number;
    category: string;
  }[] = [];

  try {
    if (process.env.DATABASE_URL) {
      analytics = await getDashboardAnalytics();

      recentEvents = await db.event.findMany({
        where: { startAt: { gte: new Date() } },
        take: 5,
        orderBy: { startAt: "asc" },
        select: { title: true, startAt: true },
      });

      recentDonations = await db.donation.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { donorName: true, amount: true, category: true },
      });
    }
  } catch {
    // Database unavailable
  }

  const stats = [
    {
      title: "Donations (All Time)",
      value: analytics.stats.totalDonations,
      sub: `€${analytics.stats.allTimeDonationTotal.toLocaleString()} raised`,
      icon: Heart,
      color: "text-gold",
    },
    {
      title: "Donations (This Month)",
      value: analytics.stats.monthDonations,
      sub: `€${analytics.stats.monthDonationTotal.toLocaleString()} this month`,
      icon: Heart,
      color: "text-emerald",
    },
    {
      title: "Upcoming Events",
      value: analytics.stats.upcomingEvents,
      sub: "Scheduled ahead",
      icon: Calendar,
      color: "text-gold",
    },
    {
      title: "New Registrations",
      value: analytics.stats.newRegistrations,
      sub: "Last 30 days",
      icon: ClipboardList,
      color: "text-emerald",
    },
    {
      title: "Gallery Images",
      value: analytics.stats.galleryImages,
      sub: "Published photos",
      icon: Image,
      color: "text-gold",
    },
  ];

  return (
    <div>
      <h1 className="mb-2 font-heading text-3xl font-semibold">Dashboard</h1>
      <p className="mb-8 text-muted-foreground">
        Overview of donations, events, registrations, and gallery activity.
      </p>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.title} className="admin-stat-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <p className="font-heading text-2xl font-bold">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <AdminDashboardCharts
        donationTrend={analytics.donationTrend}
        registrationsByClass={analytics.registrationsByClass}
        eventsByCategory={analytics.eventsByCategory}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <p className="text-muted-foreground">No upcoming events.</p>
            ) : (
              <ul className="space-y-3">
                {recentEvents.map((event) => (
                  <li
                    key={`${event.title}-${event.startAt.toISOString()}`}
                    className="flex items-center justify-between border-b border-border pb-2 last:border-0"
                  >
                    <span className="font-medium">{event.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {format(event.startAt, "d MMM yyyy")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Recent Donations</CardTitle>
          </CardHeader>
          <CardContent>
            {recentDonations.length === 0 ? (
              <p className="text-muted-foreground">No donations recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {recentDonations.map((donation, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between border-b border-border pb-2 last:border-0"
                  >
                    <div>
                      <span className="font-medium">
                        {donation.donorName || "Anonymous"}
                      </span>
                      <span className="ml-2 text-xs capitalize text-muted-foreground">
                        {donation.category.replace("-", " ")}
                      </span>
                    </div>
                    <span className="text-gold">€{donation.amount}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
