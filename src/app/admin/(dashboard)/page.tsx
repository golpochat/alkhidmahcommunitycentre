import { format, formatDistanceToNow, parseISO } from "date-fns";
import { Calendar, ClipboardList, Heart, Image, Monitor, Mail } from "lucide-react";
import { AdminDashboardCharts } from "@/components/admin/admin-dashboard-charts";
import {
  AdminPublishChecklist,
  AdminPublishStatusOverview,
} from "@/components/admin/admin-publish-overview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublishStatusOverview } from "@/lib/admin-publish-status";
import { getDashboardAnalytics } from "@/lib/admin-analytics";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let analytics: Awaited<ReturnType<typeof getDashboardAnalytics>> = {
    stats: {
      totalDonations: 0,
      monthDonations: 0,
      monthDonationTotal: 0,
      allTimeDonationTotal: 0,
      upcomingEvents: 0,
      publishedUpcomingEvents: 0,
      newRegistrations: 0,
      galleryImages: 0,
      publishedGalleryImages: 0,
      pendingContactMessages: 0,
      displayLastSeenAt: null,
      displayLastOrientation: null,
    },
    donationTrend: [] as Awaited<ReturnType<typeof getDashboardAnalytics>>["donationTrend"],
    registrationsByClass: [] as Awaited<
      ReturnType<typeof getDashboardAnalytics>
    >["registrationsByClass"],
    eventsByCategory: [] as Awaited<
      ReturnType<typeof getDashboardAnalytics>
    >["eventsByCategory"],
    donationsByCategory: [] as Awaited<
      ReturnType<typeof getDashboardAnalytics>
    >["donationsByCategory"],
    donationsByProvider: [] as Awaited<
      ReturnType<typeof getDashboardAnalytics>
    >["donationsByProvider"],
  };

  let recentEvents: { title: string; startAt: Date }[] = [];
  let recentDonations: {
    donorName: string | null;
    amount: number;
    category: string;
  }[] = [];
  let publishOverview = {
    rows: [],
    totalPublished: 0,
    totalUnpublished: 0,
    hasUnpublishedContent: false,
  } as Awaited<ReturnType<typeof getPublishStatusOverview>>;

  try {
    if (process.env.DATABASE_URL) {
      analytics = await getDashboardAnalytics();
      publishOverview = await getPublishStatusOverview();

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

      <AdminPublishChecklist overview={publishOverview} />

      <AdminPublishStatusOverview overview={publishOverview} />

      <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
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
        donationsByCategory={analytics.donationsByCategory}
        donationsByProvider={analytics.donationsByProvider}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2 text-lg">
              <Monitor className="h-5 w-5 text-gold" />
              TV Display
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {analytics.stats.displayLastSeenAt
                ? `Last active ${formatDistanceToNow(parseISO(analytics.stats.displayLastSeenAt), { addSuffix: true })}`
                : "No heartbeat recorded yet"}
            </p>
            {analytics.stats.displayLastOrientation ? (
              <p className="mt-2 text-sm capitalize">
                Orientation: {analytics.stats.displayLastOrientation}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-emerald" />
              Contact Inbox
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-bold">
              {analytics.stats.pendingContactMessages}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Pending messages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Published Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              {analytics.stats.publishedUpcomingEvents} of {analytics.stats.upcomingEvents}{" "}
              upcoming events published
            </p>
            <p>
              {analytics.stats.publishedGalleryImages} of {analytics.stats.galleryImages}{" "}
              gallery images published
            </p>
          </CardContent>
        </Card>
      </div>

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
